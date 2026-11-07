import manifest from '../../manifest.json';
import { exposeApi } from './api';
import { createIcons } from './icons';
import { patchKeywordDescriptions } from './keywords';
import { patchSummaries, registerSettings } from './settings';
import { patchPlainText, patchSearch } from './text';

export function setup(ctx: Modding.ModContext) {
  console.log(`Tiny Icons v${manifest.version} loading...`);
  const icons = createIcons(ctx);
  registerSettings(ctx);
  patchSummaries(ctx);

  // Every modifier line the game shows comes from one of these two.
  ctx.patch(ModifierValue, 'print').after(function (desc) {
    const markup = icons.forValue(this);
    return markup === '' ? desc : { ...desc, text: markup + desc.text };
  });
  ctx.patch(ModifierValue, 'printEnemy').after(function (desc) {
    const markup = icons.forValue(this);
    return markup === '' ? desc : { ...desc, text: markup + desc.text };
  });

  patchKeywordDescriptions(ctx, icons);
  patchPlainText(ctx);
  patchSearch(ctx);

  exposeApi(ctx, icons);

  ctx.onCharacterSelectionLoaded(() => icons.reportMissing());
}
