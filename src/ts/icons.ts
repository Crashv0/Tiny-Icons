// Picks the icons for a printed modifier value and turns them into markup.
//
// Icons are empty <i> elements whose class points at a rule in a stylesheet the mod
// builds at load, one rule per image. The markup holds no image path, so the game's
// keyword rewriter (which would turn "poison" inside a path into its own icon) can't
// break it, and settings can hide icons with CSS alone.

import {
  builtInSources,
  CURRENCY_TAGS,
  GENERIC_SKILL_TAG,
  SKILL_TAGS,
} from './sources';
import { modifierTags, type TagEntry, type Tags } from './tags';

/** Class on every icon. */
export const ICON_CLASS = 'tiny-icon';
/** Extra class on secondary icons, hidden unless the setting is on. */
export const SECONDARY_CLASS = 'ti-2nd';
/** Body class while Global Icons is off. */
export const LOCAL_CLASS = 'ti-local';
/** Body class while Secondary Icons is on. */
export const SECONDARY_ON_CLASS = 'ti-secondary';
/** Class on pop-ups that show icons even while Global Icons is off. */
export const SCOPE_CLASS = 'ti-scope';
/** Start of every icon's markup, used to find icons in plain text. */
export const MARKUP_START = `<i class="${ICON_CLASS}`;
/** End of every icon's markup. */
export const MARKUP_END = '"></i>';

/** Icons of one modifier for one sign of its value, with the markup cached. */
interface Side {
  readonly tags: Tags | undefined;
  /** Markup when no skill or currency scope applies. */
  plain: string | undefined;
  /** Markup by skill (or currency), then by currency (or NO_SCOPE). */
  readonly scoped: Map<object, Map<object, string>>;
}

interface Entry {
  readonly pos: Side;
  readonly neg: Side;
}

const NO_SCOPE = {};

const newSide = (tags: Tags | undefined): Side => ({
  tags,
  plain: undefined,
  scoped: new Map(),
});

export interface Icons {
  /** The markup to put before a printed modifier value; empty when it has no icon. */
  forValue(value: ModifierValue): string;
  /** Markup for one icon source (path, URL or `fa-…` class). */
  markup(source: string, secondary: boolean): string;
  /** The source registered for a tag, if any. */
  sourceOf(tag: string): string | undefined;
  /** Every tag with its source. */
  allSources(): ReadonlyMap<string, string>;
  /** Adds a tag; returns false when the tag already exists. */
  addSource(tag: string, source: string): boolean;
  /** The tags of a modifier id, if it has any. */
  tagsOf(modifierId: string): TagEntry | undefined;
  /** Sets the tags of a modifier id, replacing any it had. */
  setTags(modifierId: string, tags: TagEntry): void;
  /** The source behind an icon class (`ti-N`), if it is one. */
  sourceOfClass(name: string): string | undefined;
  /** Logs once which modifiers can never get an icon. */
  reportMissing(): void;
}

// The game builds `media` URLs on every read, which is slow; they never change.
const mediaCache = new WeakMap<object, string | undefined>();
function mediaOf(value: object | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (mediaCache.has(value)) return mediaCache.get(value);
  const media =
    'media' in value && typeof value.media === 'string'
      ? value.media
      : undefined;
  mediaCache.set(value, media);
  return media;
}

/** First tag that isn't about skills or currencies, for the secondary icon. */
const detailTag = (rowTags: Tags | undefined) =>
  rowTags?.find(
    (tag) =>
      tag !== undefined &&
      tag !== GENERIC_SKILL_TAG &&
      !SKILL_TAGS.includes(tag) &&
      !CURRENCY_TAGS.includes(tag),
  );

const cssUrl = (url: string) => `url("${url.replace(/["\\]/g, '\\$&')}")`;

export function createIcons(ctx: Modding.ModContext): Icons {
  const sources = builtInSources(ctx);
  const tags = new Map<string, TagEntry>(Object.entries(modifierTags));
  const entries = new Map<Modifier, Entry>();
  const classes = new Map<string, string>();
  const classSources = new Map<string, string>();

  const style = document.createElement('style');
  style.id = 'tiny-icons';
  style.textContent = [
    `.${ICON_CLASS}{display:inline-block;width:.875rem;height:.875rem;margin:2px 4px 4px 2px;vertical-align:middle;background:center/contain no-repeat}`,
    `.${ICON_CLASS}.fa{width:auto;height:auto;background:none}`,
    // Larger sizes for other mods, matching the game's skill-icon sizes.
    `.${ICON_CLASS}.ti-xs{width:24px;height:24px}`,
    `.${ICON_CLASS}.ti-sm{width:32px;height:32px}`,
    `.${ICON_CLASS}.ti-md{width:64px;height:64px}`,
    // Global Icons off: only the Agility and Astrology pages and their summaries.
    `body.${LOCAL_CLASS} .${ICON_CLASS}{display:none}`,
    `body.${LOCAL_CLASS} :is(#agility-container,#astrology-container,.${SCOPE_CLASS}) .${ICON_CLASS}{display:inline-block}`,
    `body:not(.${SECONDARY_ON_CLASS}) .${ICON_CLASS}.${SECONDARY_CLASS}{display:none!important}`,
  ].join('\n');
  document.head.append(style);

  /** The class for one image, adding its rule the first time it's used. */
  function classFor(source: string): string {
    let name = classes.get(source);
    if (name !== undefined) return name;
    if (source.startsWith('fa-')) {
      name = `fa ${source} text-warning`;
    } else {
      name = `ti-${classes.size}`;
      const url = source.startsWith('assets/') ? cdnMedia(source) : source;
      style.sheet?.insertRule(
        `.${name}{background-image:${cssUrl(url)}}`,
        style.sheet.cssRules.length,
      );
    }
    classes.set(source, name);
    classSources.set(name, source);
    return name;
  }

  function markup(source: string, secondary: boolean): string {
    const extra = secondary ? ` ${SECONDARY_CLASS}` : '';
    return `${MARKUP_START}${extra} ${classFor(source)}" aria-hidden="true${MARKUP_END}`;
  }

  function pair(primary: string | undefined, secondary: string | undefined) {
    if (primary === undefined) return '';
    const first = markup(primary, false);
    if (secondary === undefined || secondary === primary) return first;
    return first + markup(secondary, true);
  }

  const sourceOf = (tag: string | undefined) =>
    tag === undefined ? undefined : sources.get(tag);

  function entryFor(modifier: Modifier): Entry {
    let entry = entries.get(modifier);
    if (entry !== undefined) return entry;
    const row = tags.get(modifier.id);
    const split = row !== undefined && 'pos' in row;
    entry = {
      pos: newSide(split ? row.pos : row),
      neg: newSide(split ? row.neg : row),
    };
    entries.set(modifier, entry);
    return entry;
  }

  /** Icons when the value has no tags: the first scope object with an image. */
  function fromScope(value: ModifierValue): string {
    const realm = game.realms.size > 1 ? value.realm : undefined;
    return pair(
      mediaOf(value.damageType) ??
        mediaOf(value.item) ??
        mediaOf(value.action) ??
        mediaOf(value.subcategory) ??
        mediaOf(value.category) ??
        mediaOf(value.effectGroup) ??
        mediaOf(realm),
      undefined,
    );
  }

  function forValue(value: ModifierValue): string {
    const entry = entryFor(value.modifier);
    const side = value.value < 0 ? entry.neg : entry.pos;
    // A skill or currency scope names what the value is about: its icon comes first.
    const { skill, currency } = value;
    const first = skill ?? currency;
    if (first !== undefined) {
      const second = skill === undefined ? NO_SCOPE : (currency ?? NO_SCOPE);
      let bySecond = side.scoped.get(first);
      if (bySecond === undefined) {
        bySecond = new Map();
        side.scoped.set(first, bySecond);
      }
      let cached = bySecond.get(second);
      if (cached === undefined) {
        const detail = sourceOf(detailTag(side.tags));
        cached =
          skill === undefined
            ? pair(mediaOf(currency), detail)
            : pair(mediaOf(skill), mediaOf(currency) ?? detail);
        bySecond.set(second, cached);
      }
      return cached;
    }
    if (side.tags === undefined) return fromScope(value);
    side.plain ??= pair(sourceOf(side.tags[0]), sourceOf(side.tags[1]));
    return side.plain;
  }

  function reportMissing() {
    const missing = game.modifierRegistry.allObjects.filter(
      (modifier) =>
        !tags.has(modifier.id) &&
        modifier.allowedScopes.every(
          (scoping) => !Object.values(scoping.scopes).some(Boolean),
        ),
    );
    if (missing.length > 0) {
      console.warn(
        `[Tiny Icons] ${missing.length} modifiers have no icon: ${missing.map((m) => m.id).join(', ')}`,
      );
    }
  }

  return {
    forValue,
    markup,
    sourceOf,
    allSources: () => sources,
    addSource(tag, source) {
      if (sources.has(tag)) return false;
      sources.set(tag, source);
      entries.clear();
      return true;
    },
    tagsOf: (modifierId) => tags.get(modifierId),
    setTags(modifierId, row) {
      tags.set(modifierId, row);
      entries.clear();
    },
    sourceOfClass: (name) => classSources.get(name),
    reportMissing,
  };
}
