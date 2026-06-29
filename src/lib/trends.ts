import { db } from "./db";
import { articles, trends } from "./db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export interface TrendData {
  topic: string;
  mentionCount: number;
  growthRate: number;
  category: string;
}

export async function detectTrends(period: "daily" | "weekly" | "monthly"): Promise<TrendData[]> {
  const now = new Date();
  const periods: Record<string, Date> = {
    daily: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    weekly: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    monthly: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  const since = periods[period];
  const previous = period === "daily"
    ? new Date(since.getTime() - 24 * 60 * 60 * 1000)
    : period === "weekly"
    ? new Date(since.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(since.getTime() - 30 * 24 * 60 * 60 * 1000);

  const currentPeriod = await db
    .select({
      tags: sql<string[]>`unnest(tags)`,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(gte(articles.publicationDate, since))
    .groupBy(sql`1`)
    .limit(50);

  const previousPeriod = await db
    .select({
      tags: sql<string[]>`unnest(tags)`,
      count: sql<number>`count(*)`,
    })
    .from(articles)
    .where(and(gte(articles.publicationDate, previous), lte(articles.publicationDate, since)))
    .groupBy(sql`1`)
    .limit(50);

  const previousMap = new Map(
    previousPeriod.map((p) => [p.tags?.[0], p.count])
  );

  const trends_: TrendData[] = [];

  for (const item of currentPeriod) {
    if (!item.tags || !item.tags[0]) continue;
    const topic = item.tags[0];
    const current = item.count;
    const prev = previousMap.get(topic) || 0;
    const growthRate = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 100;

    trends_.push({
      topic,
      mentionCount: current,
      growthRate,
      category: "ai",
    });
  }

  return trends_.sort((a, b) => b.growthRate - a.growthRate);
}

export async function saveTrends(period: "daily" | "weekly" | "monthly") {
  const detected = await detectTrends(period);
  const now = new Date();

  const periodDates: Record<string, { start: Date; end: Date }> = {
    daily: {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end: now,
    },
    weekly: {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
    },
    monthly: {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
    },
  };

  const { start, end } = periodDates[period];

  for (const trend of detected) {
    await db.insert(trends).values({
      topic: trend.topic,
      period,
      mentionCount: trend.mentionCount,
      growthRate: trend.growthRate,
      category: trend.category,
      relatedTopics: [],
      startDate: start,
      endDate: end,
    });
  }
}
