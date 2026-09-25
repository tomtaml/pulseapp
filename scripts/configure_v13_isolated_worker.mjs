// Generate a local-only Wrangler config for the dedicated synthetic Worker.
// The isolated D1 UUID never needs to be committed to Git.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const [database, databaseId] = process.argv.slice(2);
if (!/^pulse-research-v13-isolated-[a-z0-9-]+$/.test(database || "") || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(databaseId || "")) {
  console.error("Usage: node scripts/configure_v13_isolated_worker.mjs pulse-research-v13-isolated-NAME <database UUID>");
  process.exit(2);
}

const directory = new URL("../v13-isolated/", import.meta.url);
const file = new URL("wrangler.local.jsonc", directory);
const config = {
  name: "pulse-srf-v13-isolated-test",
  main: "../src/research-test-entry.js",
  compatibility_date: "2026-08-11",
  workers_dev: true,
  d1_databases: [{ binding: "DB", database_name: database, database_id: databaseId }],
  ratelimits: [{ name: "SYNTHETIC_RATE_LIMITER", namespace_id: "913703", simple: { limit: 5, period: 60 } }],
  vars: {
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    RESEARCH_ALLOWED_ORIGIN: "",
    COLLECTION_ENABLED: "false",
    V13_COLLECTION_ENABLED: "false",
    RESEARCH_INSTRUMENT_MODE: "instrument-preview",
    FREE_TEXT_ENABLED: "false",
    RESEARCH_FREE_TEXT_APPROVED: "false",
    ENVIRONMENT: "preview",
    CHARGING_BACKEND_MODE: "mock",
    CHARGING_COMMANDS_ENABLED: "false"
  }
};
mkdirSync(directory, { recursive: true });
const contents = JSON.stringify(config, null, 2) + "\n";
if (existsSync(file) && readFileSync(file, "utf8") !== contents) {
  console.error("The local config already points elsewhere; refusing to overwrite it.");
  process.exit(1);
}
writeFileSync(file, contents, { mode: 0o600 });
console.log("Generated v13-isolated/wrangler.local.jsonc for a separate locked Worker.");
