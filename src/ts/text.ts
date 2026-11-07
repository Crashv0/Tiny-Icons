// Places where modifier text isn't treated as HTML.
//
// A few game menus write printed modifier text with `textContent`, which would show the
// icon markup as text; those get the icons turned into elements after they render.
// Search indexes would match words from the markup ("tiny", "class"); those get the
// markup removed. Both find icons by their fixed start and end strings, without any
// HTML parsing.

import { MARKUP_END, MARKUP_START } from './icons';

const CLASS_START = '<i class="';
const CLASS_END = '" aria-hidden="true';

/** Removes every icon's markup from a string. */
export function stripIcons(text: string): string {
  let start = text.indexOf(MARKUP_START);
  if (start === -1) return text;
  let out = '';
  let from = 0;
  while (start !== -1) {
    const end = text.indexOf(MARKUP_END, start);
    if (end === -1) break;
    out += text.slice(from, start);
    from = end + MARKUP_END.length;
    start = text.indexOf(MARKUP_START, from);
  }
  return out + text.slice(from);
}

/** Replaces icon markup inside one text node with icon elements. */
function renderInTextNode(node: Text) {
  const text = node.data;
  let start = text.indexOf(MARKUP_START);
  if (start === -1) return;
  const parts: (string | HTMLElement)[] = [];
  let from = 0;
  while (start !== -1) {
    const end = text.indexOf(MARKUP_END, start);
    if (end === -1) break;
    const classEnd = text.indexOf(CLASS_END, start);
    const icon = document.createElement('i');
    icon.className = text.slice(start + CLASS_START.length, classEnd);
    icon.setAttribute('aria-hidden', 'true');
    parts.push(text.slice(from, start), icon);
    from = end + MARKUP_END.length;
    start = text.indexOf(MARKUP_START, from);
  }
  parts.push(text.slice(from));
  node.replaceWith(...parts.filter((part) => part !== ''));
}

/** Turns icon markup shown as text anywhere under `root` into icon elements. */
export function renderIcons(root: Node | null | undefined) {
  if (root === null || root === undefined) return;
  if (!root.textContent?.includes(MARKUP_START)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (node instanceof Text && node.data.includes(MARKUP_START))
      found.push(node);
  }
  for (const node of found) renderInTextNode(node);
}

/** Fixes the game menus that write modifier text as plain text. */
export function patchPlainText(ctx: Modding.ModContext) {
  ctx.patch(MapRefinementMenuElement, 'updateRefinements').after(function () {
    for (const item of this.refinements) renderIcons(item);
  });
  ctx.patch(MapRefinementMenuElement, 'updateNewRefinement').after(function () {
    for (const button of this.refinementSelects) renderIcons(button);
  });
  ctx.patch(PrayerTooltipElement, 'setPrayer').after(function () {
    renderIcons(this.stats);
  });
  ctx.patch(RaidManager, 'fireRandomModifierSelection').after(() => {
    renderIcons(document.querySelector('.swal2-html-container'));
  });
}

/** Keeps icon markup out of the game's search indexes. */
export function patchSearch(ctx: Modding.ModContext) {
  ctx.patch(Bank, 'updateSearchArray').after(function () {
    for (const entry of this.searchArray) {
      if (entry.description !== undefined) {
        entry.description = stripIcons(entry.description);
      }
    }
  });
  ctx
    .patch(PointOfInterest, 'searchText')
    .get((searchText) => stripIcons(searchText()));
  // Built once when the game loads, by static methods that can't be patched.
  ctx.onInterfaceReady(() => {
    for (const entry of Agility.searchArray) {
      entry.modifiers = stripIcons(entry.modifiers);
    }
    for (const entry of Summoning.searchArray) {
      entry.description = stripIcons(entry.description);
    }
  });
}
