import { db } from "./db";
import { articles, clusters } from "./db/schema";
import { eq, not, isNull } from "drizzle-orm";

const SIMILARITY_THRESHOLD = 0.75;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function getKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "this", "that", "these", "those", "i", "me", "my", "we", "our",
    "you", "your", "he", "him", "his", "she", "her", "it", "its",
    "they", "them", "their", "what", "which", "who", "whom", "when",
    "where", "why", "how", "all", "each", "every", "both", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "as", "until", "after", "before", "about", "between",
    "through", "during", "above", "below", "up", "down", "out",
    "off", "over", "under", "again", "further", "then", "once",
  ]);

  const words = normalizeText(text).split(/\s+/);
  const keywords = new Set<string>();

  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      keywords.add(`${words[i]} ${words[i + 1]}`);
    }
  }

  return keywords;
}

export function calculateSimilarity(title1: string, title2: string): number {
  const kw1 = getKeywords(title1);
  const kw2 = getKeywords(title2);

  if (kw1.size === 0 || kw2.size === 0) return 0;

  const intersection = new Set([...kw1].filter((k) => kw2.has(k)));
  const union = new Set([...kw1, ...kw2]);

  return intersection.size / union.size;
}

export async function findOrCreateCluster(articleId: number, title: string, category: string): Promise<number> {
  const recentClusters = await db
    .select()
    .from(clusters)
    .where(eq(clusters.category, category))
    .limit(50);

  for (const cluster of recentClusters) {
    const clusterArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.id, cluster.topArticleId!))
      .limit(1);

    if (clusterArticle.length > 0) {
      const similarity = calculateSimilarity(title, clusterArticle[0].title);
      if (similarity >= SIMILARITY_THRESHOLD) {
        await db
          .update(clusters)
          .set({
            articleCount: cluster.articleCount + 1,
            lastSeen: new Date(),
          })
          .where(eq(clusters.id, cluster.id));

        return cluster.id;
      }
    }
  }

  const [newCluster] = await db
    .insert(clusters)
    .values({
      title,
      topArticleId: articleId,
      category,
      articleCount: 1,
      importanceScore: 0,
    })
    .returning();

  return newCluster.id;
}

export async function buildClusterSummary(clusterId: number): Promise<string> {
  const clusterArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.clusterId, clusterId))
    .limit(10);

  if (clusterArticles.length === 0) return "";

  const titles = clusterArticles.map((a) => a.title);
  return `Multiple sources report: ${titles[0]}`;
}
