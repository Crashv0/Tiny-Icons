// Item, food, potion and passive descriptions go through the game's keyword rewriter,
// which puts its own icon before words like Stun, Burn or Poison (English only). A tiny
// icon showing the same image in front of that modifier would be a duplicate, so it
// is dropped there. Other places don't rewrite keywords and keep every icon.

import { MARKUP_END, MARKUP_START, type Icons } from './icons';

const MEDIA = 'assets/media/';
const IMG = '<img';
const SRC = 'src="';
const LINE_BREAK = '<br>';

/** `status/stunned` for any URL or path to `…assets/media/status/stunned.png|svg`. */
function mediaKey(source: string): string | undefined {
  const start = source.indexOf(MEDIA);
  if (start === -1) return undefined;
  const path = source.slice(start + MEDIA.length);
  const dot = path.lastIndexOf('.');
  return dot === -1 ? path : path.slice(0, dot);
}

/** Media keys of the game images in `text` between `from` and `to`. */
function imageKeys(text: string, from: number, to: number): Set<string> {
  const keys = new Set<string>();
  let at = text.indexOf(IMG, from);
  while (at !== -1 && at < to) {
    const srcStart = text.indexOf(SRC, at);
    if (srcStart === -1 || srcStart >= to) break;
    const srcEnd = text.indexOf('"', srcStart + SRC.length);
    const key = mediaKey(text.slice(srcStart + SRC.length, srcEnd));
    if (key !== undefined) keys.add(key);
    at = text.indexOf(IMG, srcEnd);
  }
  return keys;
}

export function createKeywordDedupe(icons: Icons) {
  const iconKeys = new Map<string, string | undefined>();
  const results = new Map<string, string>();

  /** Media key of one icon's markup, from its `ti-N` class. */
  function iconKey(markup: string): string | undefined {
    const known = iconKeys.get(markup);
    if (known !== undefined || iconKeys.has(markup)) return known;
    const name = markup
      .split(/[\s"]/)
      .find((token) => icons.sourceOfClass(token) !== undefined);
    const source = name === undefined ? undefined : icons.sourceOfClass(name);
    const key = source === undefined ? undefined : mediaKey(source);
    iconKeys.set(markup, key);
    return key;
  }

  function dedupe(text: string): string {
    let start = text.indexOf(MARKUP_START);
    while (start !== -1) {
      // The icons of one modifier sit together, then its text runs to the next icon.
      const group: { from: number; to: number }[] = [];
      let end = start;
      while (text.startsWith(MARKUP_START, end)) {
        const to = text.indexOf(MARKUP_END, end) + MARKUP_END.length;
        group.push({ from: end, to });
        end = to;
      }
      const next = text.indexOf(MARKUP_START, end);
      const lineEnd = text.indexOf(LINE_BREAK, end);
      const stop = Math.min(
        next === -1 ? text.length : next,
        lineEnd === -1 ? text.length : lineEnd,
      );
      const shown = imageKeys(text, end, stop);
      if (shown.size > 0) {
        const kept = group
          .filter(({ from, to }) => {
            const key = iconKey(text.slice(from, to));
            return key === undefined || !shown.has(key);
          })
          .map(({ from, to }) => text.slice(from, to))
          .join('');
        text = text.slice(0, start) + kept + text.slice(end);
        end = start + kept.length;
      }
      start = text.indexOf(MARKUP_START, end);
    }
    return text;
  }

  /** The description without tiny icons that repeat a keyword icon in their line. */
  return (description: string): string => {
    if (!description.includes(MARKUP_START) || !description.includes(IMG)) {
      return description;
    }
    let result = results.get(description);
    if (result === undefined) {
      result = dedupe(description);
      results.set(description, result);
    }
    return result;
  };
}

/** Applies the rule to every description the keyword rewriter produces. */
export function patchKeywordDescriptions(
  ctx: Modding.ModContext,
  icons: Icons,
) {
  const dedupe = createKeywordDedupe(icons);
  ctx.patch(Item, 'modifiedDescription').get((get) => dedupe(get()));
  ctx.patch(EquipmentItem, 'modifiedDescription').get((get) => dedupe(get()));
  ctx.patch(FoodItem, 'modifiedDescription').get((get) => dedupe(get()));
  ctx.patch(PotionItem, 'modifiedDescription').get((get) => dedupe(get()));
  ctx.patch(CombatPassive, 'modifiedDescription').get((get) => dedupe(get()));
}
