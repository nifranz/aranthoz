/**
 * Create a Macro from an attribute drop.
 * Get an existing worldbuilding macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createWorldbuildingMacro(data, slot) {
  console.log(data)
  if ( !data.roll || !data.label ) return false;
  var command = `const roll = new Roll("${data.roll}", actor ? actor.getRollData() : {});
  roll.toMessage({speaker, flavor: "${data.label}"});`;
  let macro = game.macros.find(m => (m.name === data.label) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: data.label,
      type: "script",
      command: command,
      flags: { "aranthoz.attrMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export async function createAranthozMacro(data, slot) {
  console.log("aranthozMacro");
  console.log(data)
  console.log(data.rolltype);
  if (!data.rolltype) return;
  // after major changes broken legacy code for reference
  switch (data.rolltype) {
    case "skill":
      var command = `game.aranthoz.skillRoll("${data.actorid}", "${data.group}", "${data.key}")`
      var macroName = data.label;
      break;
    case "weapon":
      var command = `game.aranthoz.weaponRoll("${data.actorid}", "${data.itemid}")`;
      var item = await fromUuid(`Actor.${data.actorid}.Item.${data.itemid}`)
      var macroName = item.name;
      break;
    case "action":
      var command = `game.aranthoz.actionRoll("${data.actorid}", "${data.itemid}")`;
      var item = await fromUuid(`Actor.${data.actorid}.Item.${data.itemid}`)
      var macroName = item.name;
      break;
  }
  // if(!data.rolltype || !data.key || !data.group || !data.actorid) return;

  let macro = game.macros.find(m => (m.name === data.label) && (m.command === command));
  console.log(macro)
  if (!macro) {
    macro = await Macro.create({
      name: (macroName || "Unknown") + "-Roll",
      type: "script",
      command: command,
      flags: { "aranthoz.attrMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
