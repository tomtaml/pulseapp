import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  expectedComprehensionCount,
  validateComprehensionItems
} from "../src/comprehension-contract.js";

assert.equal(expectedComprehensionCount("fi-fleet"), 4);
assert.equal(expectedComprehensionCount("fi-citizen"), 3);
assert.equal(expectedComprehensionCount("uk-v2h"), 3);

assert.equal(
  validateComprehensionItems({
    variant: "fi-fleet",
    comprehension_items: [true, true, true, true]
  }),
  null
);

assert.match(
  validateComprehensionItems({
    variant: "fi-fleet",
    comprehension_items: [true, true, true]
  }),
  /Four comprehension items/
);

assert.equal(
  validateComprehensionItems({
    variant: "fi-citizen",
    comprehension_items: [true, true, true]
  }),
  null
);

assert.match(
  validateComprehensionItems({
    variant: "fi-citizen",
    comprehension_items: [true, true, true, true]
  }),
  /Three comprehension items/
);

const main = readFileSync("public/js/main.js", "utf8");
const production = readFileSync("src/index.js", "utf8");
const researchTest = readFileSync("src/research-test-entry.js", "utf8");
const syntheticSql = readFileSync("scripts/synthetic_research_insert.sql", "utf8");

assert.match(main, /state\.c4 === "redecision"/);
assert.match(main, /Please answer all four items/);
assert.match(production, /validateComprehensionItems\(body\)/);
assert.match(researchTest, /validateComprehensionItems\(body\)/);
assert.match(production, /research-v1\.1/);
assert.match(researchTest, /research-v1\.1/);
assert.match(syntheticSql, /"comprehension_items":\[true,true,true,true\]/);

console.log("Comprehension contract: PASS — fi-fleet 4 items, other variants 3 items");
