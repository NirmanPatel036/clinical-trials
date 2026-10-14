import type { CSSProperties } from "react";

const cache = new Map<string, CSSProperties>();

/** Turn a CSS declaration string into a React style object, so Orvant Kit styles can be used verbatim. */
export function s(css: string): CSSProperties {
  let style = cache.get(css);
  if (!style) {
    style = {};
    for (const declaration of css.split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 0) continue;
      const property = declaration.slice(0, colon).trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      (style as Record<string, string>)[property] = declaration.slice(colon + 1).trim();
    }
    // Scroll-driven styles create endless variants; drop the lot rather than grow without bound.
    if (cache.size > 2000) cache.clear();
    cache.set(css, style);
  }
  return style;
}
