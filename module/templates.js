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
        "systems/aranthoz/templates/aranthoz/parts/sheet-attributes.html",
        "systems/aranthoz/templates/aranthoz/parts/sheet-groups.html",

        //Aranthoz2 templates
        "systems/aranthoz/templates/aranthoz2/parts/weapon.html",
        "systems/aranthoz/templates/aranthoz2/parts/action.html",
        "systems/aranthoz/templates/aranthoz2/weapon/sheet-roll.html",
        "systems/aranthoz/templates/aranthoz2/weapon/sheet-action.html",
        "systems/aranthoz/templates/aranthoz2/parts/skill.html",
        "systems/aranthoz/templates/aranthoz2/parts/consumable.html",
        "systems/aranthoz/templates/aranthoz2/parts/misc.html",
    ];

  // Load the template parts
  return loadTemplates(templatePaths);
};