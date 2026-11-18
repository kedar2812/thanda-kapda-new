/**
 * Shared by the website and the dashboard editor. Keep this file free of
 * React, Next.js and Node imports so both builds can use it.
 */

/** An image as stored in site content. */
export type CmsImage = {
  /**
   * Largest file, optionally followed by "#w=640,1080,1500": the widths that
   * also exist as "<name>-<width>.<ext>". The site's image loader uses that
   * list to serve each screen the smallest file that is sharp enough.
   */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position, e.g. "50% 50%". Where the crop stays centred. */
  focus: string;
  /** 1 = as is. Above 1 zooms in on the focus point. */
  zoom: number;
};

// ---------------------------------------------------------------- editor schema

type Base = { label: string; hint?: string };

export type TextField = Base & {
  kind: "text";
  /** Textarea instead of a single line. */
  long?: boolean;
  /** Allows *emphasis* and line breaks. */
  rich?: boolean;
  max?: number;
  placeholder?: string;
};
export type UrlField = Base & { kind: "url"; placeholder?: string };
export type NumberField = Base & { kind: "number"; min?: number; max?: number; step?: number; prefix?: string; suffix?: string };
export type ToggleField = Base & { kind: "toggle" };
export type ImageField = Base & {
  kind: "image";
  /** How the site frames it, e.g. "4 / 5". Used for the crop preview. */
  aspect?: string;
};
export type IconField = Base & { kind: "icon" };
export type ListField = Base & {
  kind: "list";
  item: Field;
  min?: number;
  max?: number;
  /** Singular name for buttons: "Add question". */
  noun: string;
  /** Key of the item field shown as each row's title. */
  titleKey?: string;
};
export type GroupField = Base & { kind: "group"; fields: Record<string, Field>; /** Show fields side by side. */ columns?: 1 | 2 };

export type Field = TextField | UrlField | NumberField | ToggleField | ImageField | IconField | ListField | GroupField;

/** One editable block of a page, e.g. "Hero". */
export type Section = {
  id: string;
  label: string;
  hint?: string;
  /** Dot path into the content, e.g. "home.hero". */
  path: string;
  fields: Record<string, Field>;
  /** Website path the live preview should show for this section. */
  preview: string;
};

export type PageGroup = { id: string; label: string; description: string; sections: Section[] };
