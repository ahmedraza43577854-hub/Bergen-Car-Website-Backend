import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { LeadType } from "../validators/leads.validator";

export type CreateLeadRecord = {
  type: LeadType;
  name: string;
  email?: string;
  phone?: string;
  payload: Prisma.InputJsonValue;
};

export type LeadSearch = {
  type?: LeadType;
  q?: string;
  from?: Date;
  to?: Date;
};

function searchWhere(search: LeadSearch): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (search.type) where.type = search.type;
  const q = search.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (search.from || search.to) {
    where.createdAt = {
      ...(search.from ? { gte: search.from } : {}),
      ...(search.to ? { lte: search.to } : {}),
    };
  }
  return where;
}

export class LeadRepository {
  create(data: CreateLeadRecord) {
    return prisma.lead.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        payload: data.payload,
      },
    });
  }

  findMany(search: LeadSearch) {
    return prisma.lead.findMany({
      where: searchWhere(search),
      orderBy: { createdAt: "desc" },
    });
  }

  count(search: LeadSearch = {}) {
    return prisma.lead.count({ where: searchWhere(search) });
  }

  countByType() {
    return prisma.lead.groupBy({
      by: ["type"],
      _count: { _all: true },
    });
  }
}

export const leadRepository = new LeadRepository();
