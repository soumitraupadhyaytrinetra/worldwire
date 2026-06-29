import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  author: text("author").default("Unknown"),
  excerpt: text("excerpt").default(""),
  content: text("content").default(""),
  category: text("category").default("ai"),
  tags: text("tags").default("[]"),
  publicationDate: text("publication_date"),
  imageUrl: text("image_url"),
  importanceScore: integer("importance_score").default(0),
  companies: text("companies").default("[]"),
  technologies: text("technologies").default("[]"),
  processed: integer("processed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  feedUrl: text("feed_url").notNull(),
  url: text("url"),
  category: text("category").default("ai"),
  authority: integer("authority").default(5),
  lastFetched: text("last_fetched"),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
});
