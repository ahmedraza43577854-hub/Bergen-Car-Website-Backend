import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      requireTLS: env.email.port === 587,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }
  return transporter;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTable(rows: Array<[string, string]>): { text: string; html: string } {
  const filled = rows.filter(([, value]) => value.trim().length > 0);
  const text = filled.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = filled
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(
          label
        )}</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(value).replace(
          /\n/g,
          "<br/>"
        )}</td></tr>`
    )
    .join("");
  const html = `
    <div style="font-family:Georgia,serif;background:#0b1f3a;padding:32px 16px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
        <div style="background:#0b1f3a;padding:20px 28px">
          <p style="margin:0;color:#d4a017;font-size:12px;letter-spacing:0.16em;text-transform:uppercase">Bergen Car Company</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px">New website inquiry</h1>
        </div>
        <div style="padding:24px 28px">
          <table style="width:100%;border-collapse:collapse;font-size:15px">${htmlRows}</table>
        </div>
      </div>
    </div>`;
  return { text, html };
}

export class EmailService {
  async send(options: {
    to: string | string[];
    subject: string;
    rows: Array<[string, string]>;
    replyTo?: string;
  }): Promise<void> {
    const transport = getTransporter();
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const { text, html } = renderTable(options.rows);

    if (!transport) {
      console.warn(
        "[email] skipped (SMTP not configured). Would send:",
        options.subject,
        "→",
        recipients.join(", ")
      );
      return;
    }

    try {
      const info = await transport.sendMail({
        from: env.email.from,
        to: recipients.join(", "),
        replyTo: options.replyTo,
        subject: options.subject,
        text,
        html,
        headers: {
          "X-Auto-Response-Suppress": "OOF, AutoReply",
        },
      });
      console.info(
        "[email] sent:",
        options.subject,
        "→",
        recipients.join(", "),
        info.messageId ? `(id ${info.messageId})` : ""
      );
    } catch (error) {
      console.error("[email] send failed:", options.subject, error);
    }
  }
}

export const emailService = new EmailService();
