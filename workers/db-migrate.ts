import { importFromJson, exportToJson, closeDb } from "../src/lib/db/index";

console.log("Migrating articles.json to SQLite...");
importFromJson();

const count = exportToJson();
closeDb();
console.log(`Done! ${count} articles in SQLite + articles.json`);
