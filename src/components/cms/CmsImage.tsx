import clsx from "clsx";
import Image from "next/image";
import { safeUrl, type CmsImage as CmsImageData } from "@/content";

const FOCUS = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/;

/** Focus point and zoom as inline styles, for images the editor can crop. */
export function cropStyle(image: CmsImageData): React.CSSProperties {
  const focus = FOCUS.test(image.focus) ? image.focus : "50% 50%";
  const zoom = image.zoom > 1 ? Math.min(image.zoom, 4) : 1;
  return zoom === 1 ? { objectPosition: focus } : { objectPosition: focus, transform: `scale(${zoom})`, transformOrigin: focus };
}

/** A content image that fills its (positioned) frame, cropped as set in the dashboard. */
export function CmsImage({
  image,
  sizes,
  priority,
  className,
  alt,
}: {
  image: CmsImageData;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Overrides the stored alt text, e.g. "" for purely decorative uses. */
  alt?: string;
}) {
  const src = safeUrl(image.src, "");
  if (!src || src === "#") return null;
  return (
    <Image
      src={src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={clsx("object-cover", className)}
      style={cropStyle(image)}
    />
  );
}
