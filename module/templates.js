/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {

    // Define template paths to load
    const templatePaths = [
      // Attribute list partial.
      "systems/aranthoz/templates/simple/parts/sheet-attributes.html",
      "systems/aranthoz/templates/simple/parts/sheet-groups.html",
      "systems/aranthoz/templates/aranthoz_old/parts/sheet-attributes.html",
      "systems/aranthoz/templates/aranthoz_old/parts/sheet-groups.html",

      //Aranthoz templates
      // Actor Sheet
      // Actor Sheet Parts
      "systems/aranthoz/templates/aranthoz/actor-sheet/sheet-banner.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/sheet-navigation.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/sheet-body.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/character-tab.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/attributes-tab.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/item-table.html",
      "systems/aranthoz/templates/aranthoz/actor-sheet/item.html",


      // Item Sheet
      "systems/aranthoz/templates/aranthoz/item-sheet/item-header.html",
      "systems/aranthoz/templates/aranthoz/item-sheet/general-tab.html",
      "systems/aranthoz/templates/aranthoz/item-sheet/attributes-tab.html",
      "systems/aranthoz/templates/aranthoz/item-sheet/actions-tab.html",
      // Item Type Sheets and Parts
      // Weapon
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/weapon/weapon.html",
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/weapon/sheet-action.html",
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/weapon/sheet-roll.html",
      // Skill
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/skill/skill.html",
      // Consumable
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/consumable/consumable.html",
      // Misc
      "systems/aranthoz/templates/aranthoz/item-sheet/item-types/misc/misc.html",
    ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
