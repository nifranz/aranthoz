/**
 * Create a Macro from an attribute drop.
 * Get an existing worldbuilding macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createWorldbuildingMacro(data, slot) {
  if ( !data.roll || !data.label ) return false;
  const command = `const roll = new Roll("${data.roll}", actor ? actor.getRollData() : {});
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
  if(!data.rolltype || !data.key || !data.group || !data.actorid) return;
  console.log("roll-type: " + data.rolltype)
  const command = `game.aranthoz.aranthozSkillRoll("${data.actorid}", "${data.group}", "${data.key}")` //, "${data.value}", "${data.label}")`;
  let macro = game.macros.find(m => (m.name === data.label) && (m.command === command));
  console.log(macro)
  if (!macro) {
    macro = await Macro.create({
      name: data.label || "Unknown" + "-Roll",
      type: "script",
      command: command,
      flags: { "aranthoz.attrMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
