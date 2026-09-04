import PDFDocument from "pdfkit";
import type { DashboardFilterQuery } from "../validators/dashboard.validator";
import { FORM_LABELS } from "../dtos/inquiry.dto";
import type { DashboardInquiry } from "../dtos/inquiry.dto";

const NAVY = "#0c1424";
const GOLD = "#d2971d";
const INK = "#090c14";
const MUTED = "#5a6b86";
const MIST = "#f4f5f8";
const LINE = "#ccd3de";
const WHITE = "#ffffff";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_HEIGHT = 78;
const FOOTER_HEIGHT = 42;

type PdfMeta = {
  query: DashboardFilterQuery;
  generatedAt: Date;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function filterSummary(query: DashboardFilterQuery): string {
  const parts: string[] = [];
  const form =
    query.type && query.type !== "all"
      ? FORM_LABELS[query.type]
      : "All forms";
  parts.push(form);
  if (query.from || query.to) {
    parts.push(`Dates ${query.from ?? "any"} – ${query.to ?? "any"}`);
  }
  if (query.q) parts.push(`Search “${query.q}”`);
  return parts.join("  ·  ");
}

function roundedRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  doc.roundedRect(x, y, w, h, r);
}

export function renderInquiriesPdf(
  items: DashboardInquiry[],
  meta: PdfMeta
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 0,
      bufferPages: true,
      info: {
        Title: "Bergen Car Company — Website inquiries",
        Author: "Bergen Car Company",
        Creator: "Bergen Car Company dashboard",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const bottomLimit = PAGE_HEIGHT - FOOTER_HEIGHT - 8;
    let y = HEADER_HEIGHT + 24;

    const newPage = () => {
      doc.addPage();
      y = HEADER_HEIGHT + 24;
    };

    const ensureSpace = (height: number) => {
      if (y + height > bottomLimit) newPage();
    };

    const drawHeaderBand = () => {
      doc.save();
      doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT).fill(NAVY);
      doc.rect(0, HEADER_HEIGHT - 3, PAGE_WIDTH, 3).fill(GOLD);
      doc.fillColor(GOLD).font("Helvetica").fontSize(9);
      doc.text("BERGEN CAR COMPANY", MARGIN, 16, {
        width: CONTENT_WIDTH,
        characterSpacing: 1.4,
      });
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18);
      doc.text("Website inquiries", MARGIN, 32);
      doc.fillColor("#c5d0e0").font("Helvetica").fontSize(9);
      doc.text(filterSummary(meta.query), MARGIN, 56, {
        width: CONTENT_WIDTH - 120,
      });
      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9);
      doc.text(`${items.length} record${items.length === 1 ? "" : "s"}`, MARGIN, 56, {
        width: CONTENT_WIDTH,
        align: "right",
      });
      doc.restore();
    };

    drawHeaderBand();
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = (...args: Parameters<PDFKit.PDFDocument["addPage"]>) => {
      const result = originalAddPage(...args);
      drawHeaderBand();
      return result;
    };

    if (items.length === 0) {
      ensureSpace(80);
      roundedRect(doc, MARGIN, y, CONTENT_WIDTH, 72, 10);
      doc.fill(MIST);
      doc.fillColor(MUTED).font("Helvetica").fontSize(11);
      doc.text("No inquiries matched these filters.", MARGIN + 18, y + 28, {
        width: CONTENT_WIDTH - 36,
      });
      y += 90;
    }

    for (const item of items) {
      const detailLines = item.details.filter((d) => d.value.trim());
      const contact = [item.email, item.phone].filter(Boolean).join("   ·   ");
      const detailsHeight = detailLines.reduce((sum, detail) => {
        const h = doc.heightOfString(`${detail.label}:  ${detail.value}`, {
          width: CONTENT_WIDTH - 36,
        });
        return sum + Math.max(14, h);
      }, 0);
      const cardHeight = 58 + (contact ? 16 : 0) + detailsHeight + 16;

      ensureSpace(cardHeight);

      roundedRect(doc, MARGIN, y, CONTENT_WIDTH, cardHeight, 10);
      doc.fill(MIST);
      doc.save();
      doc.rect(MARGIN, y, 4, cardHeight).fill(GOLD);
      doc.restore();

      let cursor = y + 12;
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(8);
      doc.text(item.formLabel.toUpperCase(), MARGIN + 16, cursor, {
        width: CONTENT_WIDTH / 2,
        characterSpacing: 0.6,
      });
      doc.fillColor(MUTED).font("Helvetica").fontSize(8);
      doc.text(formatWhen(item.createdAt), MARGIN + 16, cursor, {
        width: CONTENT_WIDTH - 32,
        align: "right",
      });

      cursor += 16;
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(12);
      doc.text(item.name || item.email || "Subscriber", MARGIN + 16, cursor, {
        width: CONTENT_WIDTH - 32,
      });

      if (contact) {
        cursor += 16;
        doc.fillColor(MUTED).font("Helvetica").fontSize(9);
        doc.text(contact, MARGIN + 16, cursor, { width: CONTENT_WIDTH - 32 });
      }

      cursor += 18;
      for (const detail of detailLines) {
        const label = `${detail.label}:  `;
        const block = doc.heightOfString(`${label}${detail.value}`, {
          width: CONTENT_WIDTH - 36,
        });
        doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8);
        doc.text(detail.label, MARGIN + 16, cursor, {
          width: 90,
          continued: false,
        });
        doc.fillColor(INK).font("Helvetica").fontSize(9);
        doc.text(detail.value, MARGIN + 110, cursor, {
          width: CONTENT_WIDTH - 126,
        });
        cursor += Math.max(14, block);
      }

      y += cardHeight + 10;
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(i);
      doc.save();
      doc.moveTo(MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT + 8)
        .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT + 8)
        .strokeColor(LINE)
        .lineWidth(0.6)
        .stroke();
      doc.fillColor(MUTED).font("Helvetica").fontSize(8);
      doc.text(
        `Generated ${meta.generatedAt.toLocaleString("en-US")}  ·  22 US 46 East, Lodi, NJ  ·  Confidential`,
        MARGIN,
        PAGE_HEIGHT - 28,
        { width: CONTENT_WIDTH - 80 }
      );
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(8);
      doc.text(`Page ${i + 1} of ${range.count}`, MARGIN, PAGE_HEIGHT - 28, {
        width: CONTENT_WIDTH,
        align: "right",
      });
      doc.restore();
    }

    doc.end();
  });
}
