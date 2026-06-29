import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "deepwire.db");
const ARTICLES_PATH = path.join(process.cwd(), "data", "articles.json");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      source TEXT NOT NULL,
      author TEXT DEFAULT 'Unknown',
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      category TEXT DEFAULT 'ai',
      tags TEXT DEFAULT '[]',
      publication_date TEXT,
      image_url TEXT,
      importance_score INTEGER DEFAULT 0,
      companies TEXT DEFAULT '[]',
      technologies TEXT DEFAULT '[]',
      processed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      feed_url TEXT NOT NULL,
      url TEXT,
      category TEXT DEFAULT 'ai',
      authority INTEGER DEFAULT 5,
      last_fetched TEXT,
      enabled INTEGER DEFAULT 1
    );
  `);
}

export function importFromJson() {
  if (!fs.existsSync(ARTICLES_PATH)) {
    console.log("No articles.json found, skipping import");
    return;
  }

  const db = getDb();
  const jsonData = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8"));

  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    console.log("No articles in JSON to import");
    return;
  }

  const insert = db.prepare(
    `INSERT OR REPLACE INTO articles
      (id, title, url, source, author, excerpt, content, category, tags,
       publication_date, image_url, importance_score, companies, technologies, processed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const a of jsonData) {
      insert.run(
        a.id,
        String(a.title || ""),
        String(a.url || ""),
        String(a.source || ""),
        String(a.author || "Unknown"),
        String(a.excerpt || ""),
        String(a.content || ""),
        String(a.category || "ai"),
        JSON.stringify(a.tags || []),
        a.publicationDate || null,
        a.imageUrl || null,
        typeof a.importanceScore === "number" ? a.importanceScore : 0,
        JSON.stringify(a.companies || []),
        JSON.stringify(a.technologies || []),
        a.processed ? 1 : 0
      );
    }
  });

  tx();
  console.log(`Imported ${jsonData.length} articles to SQLite`);
}

export function exportToJson() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM articles ORDER BY id").all() as any[];

  const articles = rows.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    source: r.source,
    author: r.author,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category,
    tags: JSON.parse(r.tags || "[]"),
    publicationDate: r.publication_date,
    imageUrl: r.image_url,
    importanceScore: r.importance_score,
    companies: JSON.parse(r.companies || "[]"),
    technologies: JSON.parse(r.technologies || "[]"),
    processed: Boolean(r.processed),
  }));

  fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2));
  return articles.length;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
