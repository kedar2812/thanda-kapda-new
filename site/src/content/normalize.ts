/**
 * Coerces untrusted content (published JSON, a dashboard draft) into exactly
 * the shape of a template, usually the defaults. Wrong types fall back,
 * unknown keys are dropped and missing keys are filled, so the website can
 * render whatever arrives without crashing.
 *
 * List items line up with the template by index, so a field added to the code
 * later picks up its default. Items beyond the template's length fall back to
 * empty values rather than copying another item's words.
 */

const MAX_TEXT = 6000;
const MAX_ITEMS = 120;

type Json = unknown;

function empty(template: Json): Json {
  if (typeof template === "string") return "";
  if (typeof template === "number") return 0;
  if (typeof template === "boolean") return false;
  if (Array.isArray(template)) return [];
  if (template && typeof template === "object") {
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, empty(v)]));
  }
  return template;
}

function coerce(template: Json, value: Json, fill: boolean): Json {
  if (typeof template === "string") {
    return typeof value === "string" ? value.slice(0, MAX_TEXT) : fill ? template : "";
  }
  if (typeof template === "number") {
    return typeof value === "number" && Number.isFinite(value) ? value : fill ? template : 0;
  }
  if (typeof template === "boolean") {
    return typeof value === "boolean" ? value : fill ? template : false;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return fill ? template : [];
    const shape = template[0];
    if (shape === undefined) return [];
    return value.slice(0, MAX_ITEMS).flatMap((item, i) => {
      // Lists of plain strings simply skip anything that isn't text.
      if (typeof shape !== "object") return typeof item === typeof shape ? [coerce(shape, item, false)] : [];
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      return [i < template.length ? coerce(template[i], item, true) : coerce(empty(shape), item, false)];
    });
  }
  if (template && typeof template === "object") {
    const src = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json>) : {};
    return Object.fromEntries(
      Object.entries(template as Record<string, Json>).map(([k, t]) => [k, coerce(t, src[k], k in src ? true : fill)]),
    );
  }
  return template;
}

export function normalize<T>(template: T, value: unknown): T {
  return coerce(template, value, true) as T;
}

/** A blank list item shaped like the template's first item. */
export function blankLike<T>(sample: T): T {
  return empty(sample) as T;
}
