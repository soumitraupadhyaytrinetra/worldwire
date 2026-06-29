#!/usr/bin/env python3
"""
backfill_content.py — fill in missing article content using crawl4ai.

Reads articles.json from a repo, finds articles with content shorter than
MIN_CONTENT_LEN chars, crawls their URLs with crawl4ai (Playwright-backed,
JS-rendered), and writes the extracted HTML back into the article's content
field. Saves in place.

Usage:
  python3 backfill_content.py /path/to/repo           # all repos
  python3 backfill_content.py /path/to/repo --source "Bloomberg Markets"
  python3 backfill_content.py /path/to/repo --dry-run

The script is idempotent: it skips articles whose content is already long
enough. It writes back the full article list (not a diff) so the JSON
structure stays consistent.
"""
import argparse
import asyncio
import json
import re
import sys
import time
from pathlib import Path

# --- Config ---
MIN_CONTENT_LEN = 300          # only backfill articles with content < this
MAX_CONTENT_CHARS = 80_000     # truncate to keep articles.json manageable
PER_ARTICLE_TIMEOUT_S = 30     # Playwright timeout per page
CONCURRENCY = 4                # parallel crawls (browser pages)
DELAY_BETWEEN_BATCHES_S = 0.5  # politeness between batches

# Domains known to hard-block generic crawlers — skip rather than waste a slot
BLOCKED_DOMAINS = (
    "nytimes.com",
    "wsj.com",
    "ft.com",
    "reuters.com",
    "bloomberg.com",
    "t.co",
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
)


def is_blocked(url: str) -> bool:
    return any(d in url.lower() for d in BLOCKED_DOMAINS)


def load_articles(path: Path) -> list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_articles(path: Path, articles: list) -> None:
    # ensure_ascii=False keeps unicode chars readable
    with open(path, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)


def html_from_crawl_result(result) -> str | None:
    """Pick the best HTML representation from a crawl4ai result.

    crawl4ai returns several flavors. For the existing articles.json schema
    (where content is rendered via Astro's set:html), `cleaned_html` is the
    best fit: sanitized, main-content focused, HTML.
    """
    if not result.success:
        return None
    html = (
        getattr(result, "cleaned_html", None)
        or getattr(result, "fit_html", None)
        or getattr(result, "html", None)
    )
    if not html:
        # fallback to markdown wrapped in a paragraph
        md = getattr(result, "markdown", None) or getattr(result, "fit_markdown", None)
        if md:
            return "<p>" + md.replace("\n\n", "</p><p>").replace("\n", "<br/>") + "</p>"
        return None
    # Strip residual whitespace
    return re.sub(r"\s+", " ", html).strip()


async def crawl_one(sem, crawler, url: str) -> str | None:
    async with sem:
        try:
            result = await crawler.arun(
                url=url,
                timeout=PER_ARTICLE_TIMEOUT_S * 1000,
                # crawl4ai v0.5+ options
                word_count_threshold=10,
                exclude_external_links=True,
                remove_overlay_elements=True,
                process_iframes=True,
            )
            return html_from_crawl_result(result)
        except Exception as e:
            print(f"  err {url[:60]}: {e}", flush=True)
            return None


async def run(repo_dir: Path, source_filter: str | None, dry_run: bool) -> None:
    articles_path = repo_dir / "data" / "articles.json"
    if not articles_path.exists():
        print(f"No articles.json at {articles_path}")
        return

    articles = load_articles(articles_path)
    total = len(articles)

    # Filter to articles needing backfill
    targets = []
    for a in articles:
        if source_filter and a.get("source") != source_filter:
            continue
        content_len = len(a.get("content") or "")
        if content_len >= MIN_CONTENT_LEN:
            continue
        if not a.get("url"):
            continue
        if is_blocked(a["url"]):
            continue
        targets.append(a)

    print(f"\nRepo: {repo_dir.name}")
    print(f"Total articles: {total}")
    print(f"Need backfill:  {len(targets)}")
    if not targets:
        print("Nothing to do.")
        return

    if dry_run:
        print("Dry run — would crawl:")
        for a in targets[:10]:
            print(f"  [{a['source']}] {a['title'][:70]}")
        if len(targets) > 10:
            print(f"  ... and {len(targets) - 10} more")
        return

    # Try crawl4ai import — fail gracefully if not installed
    try:
        from crawl4ai import AsyncWebCrawler
    except ImportError:
        print("crawl4ai not installed. Run:")
        print("  /Users/somu/Downloads/.crawl4ai-venv/bin/pip install crawl4ai")
        print("  /Users/somu/Downloads/.crawl4ai-venv/bin/python -m playwright install chromium")
        sys.exit(1)

    sem = asyncio.Semaphore(CONCURRENCY)
    filled = 0
    failed = 0
    start = time.time()

    async with AsyncWebCrawler() as crawler:
        # process in batches to keep memory bounded
        BATCH = 50
        for batch_start in range(0, len(targets), BATCH):
            batch = targets[batch_start : batch_start + BATCH]
            print(
                f"\n--- Batch {batch_start // BATCH + 1} "
                f"({batch_start + 1}..{batch_start + len(batch)}/{len(targets)}) ---"
            )

            tasks = [crawl_one(sem, crawler, a["url"]) for a in batch]
            results = await asyncio.gather(*tasks)

            for art, html in zip(batch, results):
                if html and len(html) >= MIN_CONTENT_LEN:
                    art["content"] = html[:MAX_CONTENT_CHARS]
                    # also refresh the excerpt if the new content is longer
                    new_excerpt = re.sub(r"<[^>]+>", " ", html).strip()[:300]
                    if len(new_excerpt) > len(art.get("excerpt") or ""):
                        art["excerpt"] = new_excerpt
                    art["processed"] = True
                    filled += 1
                    print(f"  ✓ {art['source'][:20]:20s} {art['title'][:50]:50s} {len(html):>7} chars")
                else:
                    failed += 1
                    print(f"  ✗ {art['source'][:20]:20s} {art['title'][:50]:50s}")

            # save after each batch so progress isn't lost on a long run
            save_articles(articles_path, articles)
            await asyncio.sleep(DELAY_BETWEEN_BATCHES_S)

    elapsed = time.time() - start
    print(f"\nDone in {elapsed:.0f}s. Filled: {filled}, Failed: {failed}, Skipped: {len(targets) - filled - failed}")


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("repo_dir", type=Path, help="Path to the repo (containing data/articles.json)")
    p.add_argument("--source", type=str, default=None, help="Only process this source name")
    p.add_argument("--dry-run", action="store_true", help="List what would be processed without crawling")
    args = p.parse_args()

    asyncio.run(run(args.repo_dir, args.source, args.dry_run))


if __name__ == "__main__":
    main()
