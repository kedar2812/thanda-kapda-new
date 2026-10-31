/**
 * Checks that the dashboard editor covers the website's content:
 *  - every field in src/content/schema.ts exists in the defaults, with a matching type;
 *  - every text, number, switch and photo in the defaults has an editor field.
 *
 *   npx jiti scripts/check-content-schema.ts
 */
import { defaultContent } from "../src/content/defaults";
import { joinPath, sections } from "../src/content/schema";
import type { Field } from "../src/content/types";

const problems: string[] = [];
const covered = new Set<string>();

function at(obj: unknown, path: string): unknown {
  return path.split(".").filter(Boolean).reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

const isImage = (v: unknown) => !!v && typeof v === "object" && "src" in (v as object) && "focus" in (v as object);

/** Walks a field against the value it edits; marks covered paths. List items are covered as "[]". */
function walk(field: Field, value: unknown, path: string) {
  const fail = (why: string) => problems.push(`${path}: ${why}`);
  switch (field.kind) {
    case "text":
    case "url":
    case "icon":
      if (typeof value !== "string") return fail(`${field.kind} field but the default is ${typeof value}`);
      covered.add(path);
      return;
    case "number":
      if (typeof value !== "number") return fail(`number field but the default is ${typeof value}`);
      covered.add(path);
      return;
    case "toggle":
      if (typeof value !== "boolean") return fail(`toggle field but the default is ${typeof value}`);
      covered.add(path);
      return;
    case "image":
      if (!isImage(value)) return fail("image field but the default is not an image");
      covered.add(path);
      return;
    case "group":
      if (!value || typeof value !== "object" || Array.isArray(value)) return fail("group field but the default is not an object");
      for (const [k, f] of Object.entries(field.fields)) walk(f, (value as Record<string, unknown>)[k], `${path}.${k}`);
      return;
    case "list":
      if (!Array.isArray(value) || value.length === 0) return fail("list field but the default is not a non-empty list");
      walk(field.item, value[0], `${path}[]`);
      if (field.titleKey && field.item.kind === "group" && !(field.titleKey in field.item.fields)) fail(`titleKey "${field.titleKey}" is not a field`);
      return;
  }
}

for (const s of sections) {
  for (const [key, field] of Object.entries(s.fields)) {
    const path = joinPath(s.path, key);
    walk(field, at(defaultContent, path), path);
  }
}

// Every leaf in the defaults should be reachable from some field.
function leaves(value: unknown, path: string, out: string[]) {
  if (isImage(value)) return out.push(path);
  if (Array.isArray(value)) {
    if (value.length) leaves(value[0], `${path}[]`, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k, out);
    return;
  }
  out.push(path);
}
const all: string[] = [];
leaves(defaultContent, "", all);
// Product slugs are fixed: each has its own page address.
const fixed = new Set(["products[].slug"]);
// Products are edited one section per product; treat products.0/products.1 coverage as products[].
const norm = (p: string) => p.replace(/^products\.\d+/, "products[]");
const coveredNorm = new Set([...covered].map(norm));
const missing = all.filter((p) => !fixed.has(p) && !coveredNorm.has(p));
for (const m of missing) problems.push(`${m}: no editor field`);

const ids = sections.map((s) => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
for (const d of dupes) problems.push(`duplicate section id ${d}`);

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`✓ ${sections.length} sections, ${covered.size} fields, every one of ${all.length - fixed.size} content values is editable.`);
