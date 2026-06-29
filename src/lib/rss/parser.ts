import Parser from "rss-parser";
import * as cheerio from "cheerio";

type CustomFeed = { title: string; description?: string; link?: string };
type CustomItem = {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  creator?: string;
  "media:content"?: { $: { url: string } };
};

const parser = new Parser<CustomFeed, CustomItem>({
  customFields: {
    item: ["media:content"],
  },
});

export interface ParsedArticle {
  title: string;
  url: string;
  content: string;
  excerpt: string;
  author: string;
  publicationDate: Date;
  imageUrl: string | null;
}

function extractContent(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, iframe, .ad, .sidebar").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

function extractFirstImage(html: string): string | null {
  const $ = cheerio.load(html);
  const img = $("img").first();
  return img.attr("src") || null;
}

export async function parseFeed(feedUrl: string): Promise<ParsedArticle[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: ParsedArticle[] = [];

  for (const item of feed.items || []) {
    if (!item.title || !item.link) continue;

    const htmlContent = item.content || item.contentSnippet || "";
    const content = extractContent(htmlContent);
    const imageUrl =
      item["media:content"]?.$?.url ||
      extractFirstImage(htmlContent) ||
      null;

    items.push({
      title: item.title,
      url: item.link,
      content: content || item.title,
      excerpt: item.contentSnippet || content.slice(0, 300) || item.title,
      author: item.creator || "Unknown",
      publicationDate: item.isoDate ? new Date(item.isoDate) : new Date(),
      imageUrl,
    });
  }

  return items;
}
