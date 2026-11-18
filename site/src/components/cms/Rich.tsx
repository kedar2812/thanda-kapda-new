import { Fragment } from "react";

/**
 * Renders dashboard text: line breaks become <br>, and *words in asterisks*
 * become <em> with the given class (the gold or italic accent of each heading).
 */
export function Rich({ text, em, br }: { text: string; em?: string; /** Class for line breaks, e.g. "hidden sm:block". */ br?: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br className={br} />}
          {line.split(/\*([^*]+)\*/g).map((part, j) =>
            j % 2 === 1 ? (
              <em key={j} className={em}>
                {part}
              </em>
            ) : (
              part
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

/** Plain text for places that cannot hold markup (aria labels, meta tags). */
export function plain(text: string) {
  return text.replace(/\*([^*]+)\*/g, "$1").replace(/\s*\n\s*/g, " ");
}
