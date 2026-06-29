import type { APIRoute } from "astro";
import { getAllArticles } from "../../lib/data";

export const GET: APIRoute = async () => {
  const articles = getAllArticles().map((a) => ({
    id: a.id,
    title: a.title,
    url: a.url,
    source: a.source,
    author: a.author,
    excerpt: a.excerpt,
    category: a.category,
    publicationDate: a.publicationDate,
    imageUrl: a.imageUrl,
    importanceScore: a.importanceScore,
  }));

  return new Response(JSON.stringify(articles), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
