import { prisma } from "../lib/prisma";

export type SubscriberSearch = {
  q?: string;
  from?: Date;
  to?: Date;
};

function searchWhere(search: SubscriberSearch) {
  const query = search.q?.trim();
  return {
    ...(query ? { email: { contains: query, mode: "insensitive" as const } } : {}),
    ...(search.from || search.to
      ? {
          createdAt: {
            ...(search.from ? { gte: search.from } : {}),
            ...(search.to ? { lte: search.to } : {}),
          },
        }
      : {}),
  };
}

export class SubscriberRepository {
  findByEmail(email: string) {
    return prisma.subscriber.findUnique({ where: { email } });
  }

  create(email: string) {
    return prisma.subscriber.create({ data: { email } });
  }

  findMany(search: SubscriberSearch = {}) {
    return prisma.subscriber.findMany({
      where: searchWhere(search),
      orderBy: { createdAt: "desc" },
    });
  }

  count(search: SubscriberSearch = {}) {
    return prisma.subscriber.count({
      where: searchWhere(search),
    });
  }
}

export const subscriberRepository = new SubscriberRepository();
