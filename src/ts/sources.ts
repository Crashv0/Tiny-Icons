// Icon tags and where their images live. Tag names are part of the public API (other
// mods tag their modifiers with them), so existing names never change.

/** Folder kinds understood by `iconResourcePath`, as in 2.0.x. */
export type PathType =
  | 'skills'
  | 'skill'
  | 'bank'
  | 'main'
  | 'status'
  | 'misc'
  | 'ti'
  | 'mods'
  | 'pets'
  | 'shop'
  | 'fa';

const PATH_TYPES: readonly string[] = [
  'skills',
  'skill',
  'bank',
  'main',
  'status',
  'misc',
  'ti',
  'mods',
  'pets',
  'shop',
  'fa',
];

export const isPathType = (value: string): value is PathType =>
  PATH_TYPES.includes(value);

/**
 * Builds an icon path the way 2.0.x did: game media under `assets/media/`, the mod's
 * own images for `ti`, and a Font Awesome class name (`fa-…`) for `fa`.
 */
export function iconResourcePath(
  ctx: Modding.ModContext,
  type: PathType,
  name: string,
  specific?: string,
  ext = 'svg',
): string {
  const extension = type === 'bank' ? 'png' : ext;
  switch (type) {
    case 'skills':
    case 'skill':
      if (name === 'skill') return 'assets/media/main/Book1.png';
      return `assets/media/skills/${name}/${specific ?? name}.${extension}`;
    case 'ti':
      return ctx.getResourceUrl(`img/${name}.${extension}`);
    case 'fa':
      return `fa-${name}`;
    default:
      return `assets/media/${type}/${name}.${extension}`;
  }
}

type Row = readonly [
  tag: string,
  type: PathType,
  name: string,
  specific?: string,
  ext?: string,
];

const ROWS: readonly Row[] = [
  // Items
  ['air_rune', 'bank', 'rune_air'],
  ['ash', 'bank', 'ashes'],
  ['bird_nest', 'bank', 'bird_nest'],
  ['clothing', 'bank', 'armour_leather_body'],
  ['coal', 'bank', 'ore_coal'],
  ['dark_blade', 'bank', 'Dark_Blade_Defender'],
  ['despair', 'bank', 'Mask_of_Despair'],
  ['diamond', 'bank', 'diamond'],
  ['earth_rune', 'bank', 'rune_earth'],
  ['fire_rune', 'bank', 'rune_fire'],
  ['food', 'bank', 'beef'],
  ['golden_stardust', 'bank', 'golden_stardust'],
  ['herb', 'bank', 'herb_garum'],
  ['holy_dust', 'bank', 'holy_dust'],
  ['iron_bar', 'bank', 'iron_bar'],
  ['leather', 'bank', 'leather'],
  ['loot', 'bank', 'alchemists_bag'],
  ['madness', 'bank', 'Mask_of_Madness'],
  ['meteorite', 'skills', 'astrology', 'meteorite'],
  ['mushroom', 'bank', 'mushroom'],
  ['ore', 'skills', 'mining', 'rock_iron'],
  ['rune_essence', 'bank', 'rune_essence'],
  ['seed', 'bank', 'seeds_potato'],
  ['stardust', 'bank', 'stardust'],
  ['torment', 'bank', 'Mask_of_Torment'],
  ['water_rune', 'bank', 'rune_water'],
  // General
  ['ancient_relics', 'main', 'gamemode_ancient_relic', undefined, 'png'],
  ['aurora', 'skills', 'combat', 'auroras'],
  ['autoeat', 'shop', 'autoeat'],
  ['bank', 'main', 'bank_header'],
  ['barrier', 'skills', 'combat', 'barrier'],
  ['book', 'main', 'Book1', undefined, 'png'],
  ['coins', 'main', 'coins'],
  ['consumable', 'bank', 'consumable'],
  ['curse', 'skills', 'combat', 'curses'],
  ['dig', 'skills', 'archaeology', 'digsites'],
  ['double', 'main', 'double'],
  ['dungeon', 'skills', 'combat', 'dungeon'],
  ['equip_set', 'shop', 'equipment_set'],
  ['equip_swap', 'shop', 'equipment_swap'],
  ['gem', 'bank', 'diamond'],
  ['golbin', 'pets', 'golden_golbin'],
  ['gp', 'main', 'coins'],
  ['interval', 'main', 'timer'],
  ['item_alchemy', 'skills', 'magic', 'item_alchemy'],
  ['map', 'skills', 'archaeology', 'map_colour'],
  ['mastery', 'main', 'mastery_header'],
  ['mods', 'mods', 'placeholder_icon', undefined, 'png'],
  ['pet', 'pets', 'bandit_base'],
  ['potion', 'skills', 'herblore', 'potion_empty'],
  ['preservation', 'main', 'preservation'],
  ['shop', 'main', 'shop_header'],
  ['slayer_coins', 'main', 'slayer_coins'],
  ['unholy', 'skills', 'prayer', 'unholy_prayer'],
  ['xp', 'main', 'xp'],
  // Effects
  ['afflicted', 'misc', 'afflicted'],
  ['crystal_sanction', 'status', 'crystal_sanction'],
  ['crystallize', 'status', 'crystallized'],
  ['decay', 'skills', 'magic', 'decay'],
  ['evasion_dn', 'status', 'evasion_decrease'],
  ['evasion_up', 'status', 'evasion_increase'],
  ['frost_burn', 'status', 'frostburn'],
  ['frozen', 'status', 'frozen'],
  ['mark_of_death', 'misc', 'mark_of_death'],
  ['offense_dn', 'status', 'attack_decrease'],
  ['offense_up', 'status', 'attack_increase'],
  ['shock', 'status', 'shocked'],
  ['sleep', 'status', 'sleep'],
  ['slowed', 'status', 'slowed'],
  ['speedup', 'status', 'speedup'],
  ['stun_immunity', 'status', 'stun_immunity'],
  ['stun', 'status', 'stunned'],
  // Damage over time
  ['barrier_bleed', 'misc', 'blood'],
  ['barrier_burn', 'main', 'burn'],
  ['bleed', 'misc', 'blood'],
  ['burn', 'main', 'burn'],
  ['deadly_poison', 'status', 'poison'],
  ['poison', 'status', 'poison'],
  ['regen', 'status', 'regen_increase'],
  // Skill media
  ['air_strike', 'skills', 'magic', 'wind_strike'],
  ['arch_brush', 'skills', 'archaeology', 'brush'],
  ['arch_shovel', 'skills', 'archaeology', 'shovel'],
  ['arch_sieve', 'skills', 'archaeology', 'sieve'],
  ['arch_trowel', 'skills', 'archaeology', 'trowel'],
  ['archaic', 'skills', 'magic', 'archaic_book'],
  ['auto_slayer', 'shop', 'auto_slayer'],
  ['building', 'skills', 'township', 'menu_town'],
  ['confusion', 'skills', 'magic', 'confusion'],
  ['earth_strike', 'skills', 'magic', 'earth_strike'],
  ['fire_strike', 'skills', 'magic', 'fire_strike'],
  ['protect_item', 'skills', 'prayer', 'protect_item'],
  ['spellbook', 'skills', 'combat', 'spellbook'],
  ['surge', 'skills', 'magic', 'wind_surge'],
  ['water_strike', 'skills', 'magic', 'water_strike'],
  ['ti_attack_interval', 'ti', 'attack_interval'],
  ['ti_combat_dn', 'ti', 'combat_dn'],
  ['ti_combat_up', 'ti', 'combat_up'],
  ['ti_dr_dn', 'ti', 'dr_dn'],
  ['ti_dr_up', 'ti', 'dr_up'],
  ['ti_magic_dn', 'ti', 'magic_dn'],
  ['ti_magic_up', 'ti', 'magic_up'],
  ['ti_ranged_dn', 'ti', 'ranged_dn'],
  ['ti_ranged_up', 'ti', 'ranged_up'],
  ['ti_strength_dn', 'ti', 'strength_dn'],
  ['ti_strength_up', 'ti', 'strength_up'],
  // Township
  ['ts_bar', 'bank', 'iron_bar'],
  ['ts_biome_arid_plains', 'skills', 'township', 'arid_plains', 'png'],
  ['ts_biome_desert', 'skills', 'township', 'desert', 'png'],
  ['ts_biome_forest', 'skills', 'township', 'forest', 'png'],
  ['ts_biome_grasslands', 'skills', 'township', 'grasslands', 'png'],
  ['ts_biome_jungle', 'skills', 'township', 'jungle', 'png'],
  ['ts_biome_mountains', 'skills', 'township', 'mountains', 'png'],
  ['ts_biome_snowlands', 'skills', 'township', 'snowlands', 'png'],
  ['ts_biome_swamp', 'skills', 'township', 'swamp', 'png'],
  ['ts_biome_valley', 'skills', 'township', 'valley', 'png'],
  ['ts_biome_water', 'skills', 'township', 'water', 'png'],
  ['ts_clothing', 'bank', 'armour_leather_body'],
  ['ts_coal', 'skills', 'township', 'coal'],
  ['ts_education', 'skills', 'township', 'education'],
  ['ts_food', 'bank', 'raw_beef'],
  ['ts_happiness', 'skills', 'township', 'happiness'],
  ['ts_health', 'skills', 'township', 'health'],
  ['ts_herb', 'bank', 'herb_garum'],
  ['ts_leather', 'bank', 'leather'],
  ['ts_ore', 'skills', 'mining', 'rock_iron'],
  ['ts_planks', 'skills', 'township', 'planks'],
  ['ts_population', 'skills', 'township', 'population'],
  ['ts_potion', 'skills', 'township', 'potion'],
  ['ts_repair', 'fa', 'hammer'],
  ['ts_rune', 'bank', 'rune_essence'],
  ['ts_season_eclipse', 'skills', 'township', 'eclipse', 'png'],
  ['ts_season_nightfall', 'skills', 'township', 'nightfall', 'png'],
  ['ts_stone', 'skills', 'township', 'stone'],
  ['ts_storage', 'skills', 'township', 'storage'],
  ['ts_trader', 'skills', 'township', 'menu_trader'],
  ['ts_wood', 'skills', 'township', 'wood'],
  ['ts_worship', 'skills', 'township', 'worship'],
  ['ts_soul_storage', 'skills', 'township', 'soul_storage', 'png'],
  // Added for game v1.3, from the game's own images
  ['ablaze', 'status', 'ablaze', undefined, 'png'],
  ['laceration', 'status', 'laceration', undefined, 'png'],
  ['toxin', 'status', 'Toxin', undefined, 'png'],
  ['voidburst', 'status', 'voidburst', undefined, 'png'],
  ['soul', 'bank', 'Lesser_Soul'],
  ['abyssal_pieces', 'main', 'abyssal_pieces', undefined, 'png'],
  ['abyssal_slayer_coins', 'main', 'abyssal_slayer_coins', undefined, 'png'],
  ['clicker', 'main', 'clickermode', undefined, 'png'],
  ['starfall', 'skills', 'astrology', 'starfall', 'png'],
  ['strongholds', 'skills', 'combat', 'strongholds', 'png'],
  ['eternal_darkness', 'skills', 'combat', 'impending_darkness', 'png'],
  ['corruption', 'skills', 'corruption', undefined, 'png'],
  ['harvesting', 'skills', 'harvesting', undefined, 'png'],
];

/** Tags named after a skill; the skill's own icon. */
export const SKILL_TAGS: readonly string[] = [
  'agility',
  'archaeology',
  'astrology',
  'attack',
  'cartography',
  'combat',
  'cooking',
  'crafting',
  'defence',
  'farming',
  'firemaking',
  'fishing',
  'fletching',
  'herblore',
  'hitpoints',
  'magic',
  'mining',
  'prayer',
  'ranged',
  'runecrafting',
  'slayer',
  'smithing',
  'strength',
  'summoning',
  'thieving',
  'township',
  'woodcutting',
  'corruption',
  'harvesting',
];

/** Tags whose icon is a currency's, replaced by the currency of a currency-scoped value. */
export const CURRENCY_TAGS: readonly string[] = ['gp', 'coins', 'slayer_coins'];

/** The generic skill tag: the skill of a skill-scoped value takes its place. */
export const GENERIC_SKILL_TAG = 'skill';

/** Every built-in tag and its source: a game asset path, a mod URL or a Font Awesome class. */
export function builtInSources(ctx: Modding.ModContext): Map<string, string> {
  const sources = new Map<string, string>();
  for (const [tag, type, name, specific, ext] of ROWS) {
    sources.set(tag, iconResourcePath(ctx, type, name, specific, ext));
  }
  for (const skill of SKILL_TAGS) {
    if (!sources.has(skill)) {
      sources.set(skill, iconResourcePath(ctx, 'skills', skill));
    }
  }
  sources.set(GENERIC_SKILL_TAG, iconResourcePath(ctx, 'skills', 'skill'));
  sources.set('lemon', 'assets/april/images/lemon.jpg');
  return sources;
}
