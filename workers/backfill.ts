// WorldWire doesn't need a dedicated backfill — fresh RSS ingestion covers it.
// This script is a placeholder that points users to `npm run ingest`.
// Kept as a valid package.json script so the project structure matches its
// siblings and the cron workflow stays consistent.
async function main() {
  console.log("WorldWire does not have a dedicated backfill step.");
  console.log("Fresh articles are pulled on every cron run via `npm run ingest`.");
  console.log("");
  console.log("To trigger an ad-hoc pull right now:");
  console.log("  npm run ingest              # all sources");
  console.log('  npm run ingest "BBC World"  # one source only');
}

main().catch(console.error);
