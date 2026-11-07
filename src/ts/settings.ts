import { LOCAL_CLASS, SCOPE_CLASS, SECONDARY_ON_CLASS } from './icons';

// Section and setting names are what players' saved settings are stored under;
// renaming them would reset everyone's choices.
const SECTION = 'Tiny Icons';
const GLOBAL = 'global-icons';
const SECONDARY = 'secondary-icons';

// What a mod hands to `section.add`; melvor-types only describes the resolved config.
interface SwitchInput {
  type: 'switch';
  name: string;
  label: string;
  hint: string;
  default: boolean;
  onChange(value: boolean): void;
}

// The game reverts a setting when onChange returns false, so these return nothing.
function showGlobal(on: boolean): void {
  document.body.classList.toggle(LOCAL_CLASS, !on);
}
function showSecondary(on: boolean): void {
  document.body.classList.toggle(SECONDARY_ON_CLASS, on);
}

/**
 * Registers the settings. They act through classes on `body`, so changes apply at
 * once to everything on screen and to every cached description.
 */
export function registerSettings(ctx: Modding.ModContext) {
  const section = ctx.settings.section(SECTION);
  const inputs: SwitchInput[] = [
    {
      type: 'switch',
      name: GLOBAL,
      label: 'Enable Global Icons',
      hint: 'Show icons outside of Astrology and Agility',
      default: true,
      onChange: showGlobal,
    },
    {
      type: 'switch',
      name: SECONDARY,
      label: 'Enable Secondary Icons',
      hint: 'Show a second icon for what the modifier applies to',
      default: false,
      onChange: showSecondary,
    },
  ];
  // The game completes each config itself; the types only describe the completed form.
  Reflect.apply(section.add, section, [inputs]);

  const apply = () => {
    showGlobal(section.get(GLOBAL) !== false);
    showSecondary(section.get(SECONDARY) === true);
  };
  apply();
  ctx.onCharacterLoaded(apply);
}

const markSummary = () =>
  document.querySelector('.swal2-popup')?.classList.add(SCOPE_CLASS);

/** Marks the Agility and Astrology summary pop-ups, which keep icons with Global Icons off. */
export function patchSummaries(ctx: Modding.ModContext) {
  ctx.patch(Agility, 'viewAllPassivesOnClick').after(markSummary);
  ctx.patch(Astrology, 'viewAllModifiersOnClick').after(markSummary);
}
