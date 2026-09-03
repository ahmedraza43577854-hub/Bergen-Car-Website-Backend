import { LEAD_TYPES, type LeadType } from "../validators/leads.validator";

export const FORM_LABELS: Record<LeadType | "newsletter", string> = {
  contact: "Contact",
  "location-contact": "Homepage contact",
  sell: "Sell your car",
  trade: "Trade-in",
  financing: "Financing",
  service: "Service",
  "test-drive": "Test drive",
  newsletter: "Newsletter",
};

export const FORM_ORDER: Array<LeadType | "newsletter"> = [
  ...LEAD_TYPES,
  "newsletter",
];

export type InquiryDetail = {
  label: string;
  value: string;
};

export type DashboardInquiry = {
  id: string;
  form: LeadType | "newsletter";
  formLabel: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  details: InquiryDetail[];
};

export type DashboardStats = {
  total: number;
  byForm: Record<LeadType | "newsletter", number>;
};

export type DashboardInquiriesResponse = {
  items: DashboardInquiry[];
  total: number;
  page: number;
  limit: number;
  stats: DashboardStats;
};
