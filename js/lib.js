// htm 3.1.1 + Preact standalone build, vendored from jsdelivr (exact version) so the page makes no runtime script call.
export { html, render, useState, useEffect, useRef, useMemo, useCallback } from './vendor/htm-preact-3.1.1.module.js';

/** Monochrome DS3 icon, recoloured with a token (CSS mask). */
export const iconStyle = (name, color, size = 24) =>
  `width:${size}px;height:${size}px;flex:none;background:${color};-webkit-mask:url(assets/icons/${name}.svg) center/contain no-repeat;mask:url(assets/icons/${name}.svg) center/contain no-repeat;`;
