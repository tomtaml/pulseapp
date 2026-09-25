#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protectedConfig = readFileSync(resolve(root, "research-test/wrangler.jsonc"));
const protectedBlobSha = "cb11df7559049c5d1fd21752c5f991f60bf81045";
const header = Buffer.from(`blob ${protectedConfig.length}\0`);
const actualBlobSha = createHash("sha1").update(header).update(protectedConfig).digest("hex");

function requireCondition(condition, message) {
  if (!condition) {
    console.error(`Preview isolation check failed: ${message}`);
    process.exitCode = 1;
  }
}

requireCondition(actualBlobSha === protectedBlobSha, "the public v1.2 Worker config differs from its frozen baseline");

let preview;
try {
  preview = JSON.parse(readFileSync(resolve(root, "variant-preview/wrangler.jsonc"), "utf8"));
} catch (error) {
  console.error(`Preview isolation check failed: cannot read preview config (${error.message})`);
  process.exit(1);
}

requireCondition(preview.name === "pulse-srf-variant-preview", "preview target is not pulse-srf-variant-preview");
requireCondition(preview.name !== "pulse-srf-research-test", "preview targets the public v1.2 Worker");
requireCondition(preview.main === "../src/index.js", "unexpected preview entry point");
requireCondition(preview.assets?.directory === "../public", "unexpected preview assets directory");
for (const binding of ["d1_databases", "kv_namespaces", "r2_buckets", "durable_objects", "queues", "services", "ratelimits"]) {
  requireCondition(!Object.hasOwn(preview, binding), `preview has a ${binding} binding`);
}
requireCondition(preview.vars?.COLLECTION_ENABLED === "false", "collection is not disabled");
requireCondition(preview.vars?.RESEARCH_INSTRUMENT_MODE === "instrument-preview", "unexpected instrument mode");
requireCondition(preview.vars?.ENVIRONMENT === "preview", "preview is marked as a different environment");
requireCondition(preview.vars?.CHARGING_COMMANDS_ENABLED === "false", "charging commands are not disabled");

if (process.exitCode) process.exit(process.exitCode);
console.log("Preview isolation check passed: public v1.2 config unchanged; preview target and collection lock verified.");
