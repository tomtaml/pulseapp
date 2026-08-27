export function expectedComprehensionCount(variant) {
  return variant === "fi-fleet" ? 4 : 3;
}

export function validateComprehensionItems(body) {
  const expected = expectedComprehensionCount(body?.variant);
  const items = body?.comprehension_items;
  if (!Array.isArray(items)
      || items.length !== expected
      || items.some(value => typeof value !== "boolean")) {
    const word = expected === 4 ? "Four" : "Three";
    return `${word} comprehension items are required for ${body?.variant || "this variant"}.`;
  }
  return null;
}
