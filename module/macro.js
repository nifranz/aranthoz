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

  // creating macro contents
  switch (data.rolltype) {
    case "action":
      var command = `game.aranthoz.rolls.actionRoll("${data.actorid}", "${data.itemid}", "${data.actionkey}")`
      var macroName = `${data.itemname}: ${ data.name || "Unnamed Actio" }`;
      var macroType = "actionRoll"
      break;

    case "attribute":
      var command = `game.aranthoz.rolls.attributeRoll("${data.actorid}", "${data.group}", "${data.key}")`;
      var macroName = data.label || "Unknown Attribute"
      var macroType = "attributeRoll"
      break;
        // case "skill":
        //   var command = `game.aranthoz.rolls.skillRoll("${data.actorid}", "${data.itemid}")`
        //   var macroName = data.name;
        //   break;
        // case "weapon":
        //   var command = `game.aranthoz.rolls.weaponRoll("${data.actorid}", "${data.itemid}")`;
        //   var macroName = data.name;
        //   break;
  }

  // creating the macro in the hotbar
  let macro = game.macros.find(m => (m.name === data.label) && (m.command === command));
  console.log(macro)
  if (!macro) {
    macro = await Macro.create({
      name: (macroName || "Unknown") + " Roll",
      type: "script",
      command: command,
      img: data.img || "icons/svg/d20.svg",
      flags: { "aranthoz.attrMacro": true}
    });
  }
  macro.setFlag("aranthoz", "macroType", macroType)
  console.log(macro)
  console.log(macro.getFlag("aranthoz", "macroType"))
  game.user.assignHotbarMacro(macro, slot);
  return false;
}


 