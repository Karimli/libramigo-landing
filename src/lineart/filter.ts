// The ink filter (a slight wobble that makes lines read as ink rather than vector) is only
// worth having where the browser renders it sharply. WebKit (Safari, and every browser on
// iPhone and iPad) rasterises SVG filters at one pixel per CSS pixel, so on a 2x or 3x screen
// the whole figure turns blurry. There the scenes are drawn without it: crisp plain lines.

import { inkDefs } from './lib/ink.ts';

/** True for WebKit-based browsers: Safari on Mac, and all browsers on iOS (CriOS, FxiOS, …). */
export function blurryFilters(ua = navigator.userAgent): boolean {
  return /AppleWebKit/.test(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\/|Android/.test(ua);
}

/** The value for a `filter` attribute: the ink filter, or "none" where it would blur. */
export function inkFilter(svg: SVGSVGElement, id: string): string {
  return blurryFilters() ? 'none' : inkDefs(svg, id).filter;
}
