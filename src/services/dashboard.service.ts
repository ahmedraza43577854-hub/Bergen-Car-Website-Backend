import { LEAD_TYPES, type LeadType } from "../validators/leads.validator";
import type {
  DashboardFilterQuery,
  DashboardInquiriesQuery,
} from "../validators/dashboard.validator";
import { leadRepository } from "../repositories/lead.repository";
import { subscriberRepository } from "../repositories/subscriber.repository";
import { renderInquiriesPdf } from "./dashboard-pdf";
import {
  FORM_LABELS,
  FORM_ORDER,
  type DashboardInquiry,
  type DashboardInquiriesResponse,
  type DashboardStats,
  type InquiryDetail,
} from "../dtos/inquiry.dto";

const DETAIL_LABELS: Record<string, string> = {
  message: "Message",
  topic: "Topic",
  year: "Year",
  make: "Make",
  model: "Model",
  trim: "Trim",
  mileage: "Mileage",
  condition: "Condition",
  vin: "VIN",
  zip: "ZIP",
  employment: "Employment",
  income: "Income",
  housing: "Housing",
  credit: "Credit range",
  date: "Date",
  time: "Time",
  details: "Service details",
  notes: "Notes",
  vehicleId: "Vehicle ID",
  vehicleYear: "Vehicle year",
  vehicleMake: "Vehicle make",
  vehicleModel: "Vehicle model",
  vehicleTrim: "Vehicle trim",
};

const LEAD_TYPE_SET = new Set<string>(LEAD_TYPES);

function isLeadType(value: string): value is LeadType {
  return LEAD_TYPE_SET.has(value);
}

function detailsFromPayload(payload: unknown): InquiryDetail[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const details: InquiryDetail[] = [];
  for (const [key, raw] of Object.entries(payload as Record<string, unknown>)) {
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value) continue;
    details.push({
      label: DETAIL_LABELS[key] ?? key,
      value,
    });
  }
  return details;
}

function emptyStats(): DashboardStats {
  const byForm = Object.fromEntries(
    FORM_ORDER.map((form) => [form, 0])
  ) as DashboardStats["byForm"];
  return { total: 0, byForm };
}

function dateBounds(from?: string, to?: string) {
  return {
    from: from ? new Date(`${from}T00:00:00.000`) : undefined,
    to: to ? new Date(`${to}T23:59:59.999`) : undefined,
  };
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class DashboardService {
  async stats(): Promise<DashboardStats> {
    const [grouped, newsletter] = await Promise.all([
      leadRepository.countByType(),
      subscriberRepository.count(),
    ]);

    const stats = emptyStats();
    for (const row of grouped) {
      const typeName = String(row.type);
      if (isLeadType(typeName)) {
        stats.byForm[typeName] = row._count._all;
      }
    }
    stats.byForm.newsletter = newsletter;
    stats.total = FORM_ORDER.reduce((sum, form) => sum + stats.byForm[form], 0);
    return stats;
  }

  private async collect(query: DashboardFilterQuery): Promise<DashboardInquiry[]> {
    const { type, q, from, to } = query;
    const range = dateBounds(from, to);
    const items: DashboardInquiry[] = [];

    if (type === "all" || type === "newsletter") {
      const subscribers = await subscriberRepository.findMany({
        q,
        from: range.from,
        to: range.to,
      });
      for (const subscriber of subscribers) {
        items.push({
          id: subscriber.id,
          form: "newsletter",
          formLabel: FORM_LABELS.newsletter,
          name: null,
          email: subscriber.email,
          phone: null,
          createdAt: subscriber.createdAt.toISOString(),
          details: [{ label: "Email", value: subscriber.email }],
        });
      }
    }

    if (type !== "newsletter") {
      const leads = await leadRepository.findMany({
        type: type === "all" ? undefined : type,
        q,
        from: range.from,
        to: range.to,
      });
      for (const lead of leads) {
        const rawType = String(lead.type);
        const form: LeadType = isLeadType(rawType) ? rawType : "contact";
        items.push({
          id: lead.id,
          form,
          formLabel: FORM_LABELS[form],
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          createdAt: lead.createdAt.toISOString(),
          details: detailsFromPayload(lead.payload),
        });
      }
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return items;
  }

  async list(query: DashboardInquiriesQuery): Promise<DashboardInquiriesResponse> {
    const { page, limit } = query;
    const [stats, items] = await Promise.all([this.stats(), this.collect(query)]);
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total: items.length,
      page,
      limit,
      stats,
    };
  }

  async exportCsv(query: DashboardFilterQuery): Promise<string> {
    const items = await this.collect(query);
    const header = ["Form", "Name", "Email", "Phone", "Submitted", "Details"];
    const rows = items.map((item) =>
      [
        item.formLabel,
        item.name ?? "",
        item.email ?? "",
        item.phone ?? "",
        item.createdAt,
        item.details.map((detail) => `${detail.label}: ${detail.value}`).join(" | "),
      ]
        .map(csvCell)
        .join(",")
    );
    return `\uFEFF${[header.join(","), ...rows].join("\r\n")}\r\n`;
  }

  async exportPdf(query: DashboardFilterQuery): Promise<Buffer> {
    const items = await this.collect(query);
    return renderInquiriesPdf(items, {
      query,
      generatedAt: new Date(),
    });
  }
}

export const dashboardService = new DashboardService();
