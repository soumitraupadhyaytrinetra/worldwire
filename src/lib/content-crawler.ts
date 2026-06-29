import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface CrawledContent {
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  author: string;
}

function extractMetaContent(doc: Document, selectors: string[]): string {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const content = el.getAttribute("content") || el.textContent || "";
      if (content.trim()) return content.trim();
    }
  }
  return "";
}

export async function crawlArticle(url: string, timeout = 15000): Promise<CrawledContent | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article || !article.content) return null;

    const ogImage =
      extractMetaContent(doc, [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[name="thumbnail"]',
      ]) || null;

    const author =
      extractMetaContent(doc, [
        'meta[name="author"]',
        'meta[property="article:author"]',
      ]) || "";

    const excerpt =
      extractMetaContent(doc, [
        'meta[property="og:description"]',
        'meta[name="description"]',
        'meta[property="twitter:description"]',
      ]) || article.excerpt || "";

    const textContent = article.textContent?.replace(/\s+/g, " ").trim() || "";

    let cleanContent = article.content;
    const readabilityMatch = cleanContent.match(/<div[^>]*id="readability-page-1"[^>]*>([\s\S]*)<\/div>\s*$/i);
    if (readabilityMatch) {
      cleanContent = readabilityMatch[1];
    }

    return {
      title: article.title || "",
      content: cleanContent,
      excerpt: excerpt || textContent.slice(0, 300),
      imageUrl: ogImage,
      author,
    };
  } catch (err) {
    return null;
  }
}
