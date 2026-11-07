// The public API, `mod.api.tinyIcons`, with the names and arguments of 2.0.x so mods
// written against it keep working. Modifier keys from before game v1.3 still work where
// the game knows them as aliases (each alias is an increase or a decrease of a current
// modifier); current modifier ids work too.

import { MARKUP_END, MARKUP_START, type Icons } from './icons';
import { iconResourcePath, isPathType } from './sources';
import type { TagEntry, Tags } from './tags';

/** 2.0.x value argument: a number, or a skill and number for skill modifiers. */
type LegacyValue = number | { skill?: AnySkill; value: number };

interface Resolved {
  modifier: Modifier;
  /** Which sign an old key stood for; undefined for a current id (both signs). */
  sign: 'pos' | 'neg' | undefined;
}

const SIZES: readonly string[] = ['xs', 'sm', 'md'];

const toTags = (value: unknown): Tags | undefined => {
  if (!Array.isArray(value)) return undefined;
  const [primary, secondary]: unknown[] = value;
  if (typeof primary !== 'string') return undefined;
  return typeof secondary === 'string' ? [primary, secondary] : [primary];
};

const sideOf = (entry: TagEntry | undefined, sign: 'pos' | 'neg') =>
  entry === undefined ? undefined : 'pos' in entry ? entry[sign] : entry;

function resolve(key: string): Resolved | undefined {
  const alias = game.modifierRegistry.getAlias(key);
  if (alias !== undefined) {
    return {
      modifier: alias.modifier,
      sign: alias.isNegative ? 'neg' : 'pos',
    };
  }
  const modifier = game.modifierRegistry.getObjectByID(
    Modifier.getIdFromKey(key),
  );
  return modifier === undefined ? undefined : { modifier, sign: undefined };
}

/** A pop-up listing every modifier the game knows, with its icons. */
function viewAllModifiers() {
  const lines: string[] = [];
  for (const modifier of game.modifierRegistry.allObjects) {
    const scoping = modifier.allowedScopes[0];
    if (scoping === undefined) continue;
    const scope: IModifierScope = {};
    let supported = true;
    for (const [name, used] of Object.entries(scoping.scopes)) {
      if (!used) continue;
      if (name === 'skill') scope.skill = game.woodcutting;
      else if (name === 'currency') scope.currency = game.gp;
      else if (name === 'realm') scope.realm = game.defaultRealm;
      else if (name === 'damageType') scope.damageType = game.normalDamage;
      else supported = false;
    }
    if (!supported) continue;
    const amount = modifier.allowPositive ? 1 : -1;
    const { text, isNegative } = new ModifierValue(
      modifier,
      amount,
      scope,
    ).print();
    const textClass = isNegative ? 'text-danger' : 'text-success';
    lines.push(
      `<h5 class="font-w400 font-size-sm mb-1 ${textClass}">${text}</h5>`,
    );
  }
  void SwalLocale.fire({
    html: `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke">All Game Modifiers</h5><h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Visual Only)</small></h5>${lines.join('')}`,
  });
}

export function exposeApi(ctx: Modding.ModContext, icons: Icons) {
  const warned = new Set<string>();
  const warnOnce = (message: string) => {
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(`[Tiny Icons] ${message}`);
  };

  /** Adds tags for one key; existing tags of that sign are kept, as in 2.0.x. */
  function addModifierTags(key: string, tags: Tags) {
    const found = resolve(key);
    if (found === undefined) {
      warnOnce(`Unknown modifier "${key}", skipped.`);
      return;
    }
    const id = found.modifier.id;
    const current = icons.tagsOf(id);
    if (found.sign === undefined) {
      if (current !== undefined) {
        warnOnce(`Modifier ${id} already has icons, skipped.`);
        return;
      }
      icons.setTags(id, tags);
      return;
    }
    const other = found.sign === 'pos' ? 'neg' : 'pos';
    if (sideOf(current, found.sign) !== undefined) {
      warnOnce(`Modifier ${key} already has icons, skipped.`);
      return;
    }
    const otherTags = sideOf(current, other) ?? tags;
    icons.setTags(
      id,
      found.sign === 'pos'
        ? { pos: tags, neg: otherTags }
        : { pos: otherTags, neg: tags },
    );
  }

  // Other mods may call before their modifiers are registered; apply once all are.
  let ready = false;
  const queued: [string, Tags][] = [];
  ctx.onModsLoaded(() => {
    ready = true;
    for (const [key, tags] of queued.splice(0)) addModifierTags(key, tags);
  });

  function iconHTML(
    key: string,
    value: LegacyValue,
    secondary?: boolean,
    size?: string,
  ): string {
    const found = resolve(key);
    if (found === undefined) {
      warnOnce(`Unknown modifier "${key}".`);
      return '';
    }
    const amount = typeof value === 'number' ? value : value.value;
    const skill = typeof value === 'number' ? undefined : value.skill;
    const signed =
      found.sign === undefined
        ? amount
        : (found.sign === 'neg' ? -1 : 1) * Math.abs(amount === 0 ? 1 : amount);
    let markup = icons.forValue(
      new ModifierValue(
        found.modifier,
        signed,
        skill === undefined ? {} : { skill },
      ),
    );
    if (secondary === false) {
      const firstEnd = markup.indexOf(MARKUP_END);
      if (firstEnd !== -1)
        markup = markup.slice(0, firstEnd + MARKUP_END.length);
    }
    if (size !== undefined && SIZES.includes(size)) {
      markup = markup.replaceAll(MARKUP_START, `${MARKUP_START} ti-${size}`);
    }
    return markup;
  }

  ctx.api({
    /** Adds tags and their image sources: `{ tag: url }`. Existing tags are kept. */
    addTagSources: (customTags: Record<string, unknown>) => {
      for (const [tag, source] of Object.entries(customTags)) {
        if (typeof source !== 'string') continue;
        if (!icons.addSource(tag, source))
          warnOnce(`Tag "${tag}" already exists.`);
      }
    },
    /** Tags modifiers: `{ modifierKeyOrId: [primaryTag, secondaryTag?] }`. */
    addCustomModifiers: (customModifiers: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(customModifiers)) {
        const tags = toTags(value);
        if (tags === undefined) continue;
        if (ready) addModifierTags(key, tags);
        else queued.push([key, tags]);
      }
    },
    /** The tags of a modifier key or id: primary first, then secondary. */
    getIconTagsForModifier: (key: string): string[] => {
      const found = resolve(key);
      if (found === undefined) {
        warnOnce(`Unknown modifier "${key}".`);
        return [];
      }
      const entry = icons.tagsOf(found.modifier.id);
      const tags = sideOf(entry, found.sign ?? 'pos') ?? sideOf(entry, 'neg');
      return tags === undefined ? [] : tags.filter((tag) => tag !== undefined);
    },
    /** Icon markup for a modifier key or id and value; size: 'xxs', 'xs', 'sm' or 'md'. */
    getIconHTMLForModifier: iconHTML,
    /** A game media path from the 2.0.x path rules, e.g. ("skills", "mining"). */
    getIconResourcePath: (
      type: string,
      name: string,
      specific?: string,
      ext?: string,
    ): string => {
      if (!isPathType(type))
        throw new Error(`[Tiny Icons] Unsupported icon path type: ${type}`);
      return iconResourcePath(ctx, type, name, specific, ext);
    },
    /** Every tag with an icon. */
    getAvailableTags: (): string[] => [...icons.allSources().keys()],
    /** Every tag with its image source. */
    getAvailableTagsWithSources: (): Record<string, string> =>
      Object.fromEntries(icons.allSources()),
    /** Shows every modifier with its icons in a pop-up. */
    viewAllModifiers,
  });
}
