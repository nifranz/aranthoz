export class RollHelper {}

export async function skillRoll (actorid, skillGroup, skillKey) {
    const actor = Actor.get(actorid)
    const characterName = actor.name;
    const skill = actor.system.attributes[skillGroup][skillKey];
    if (!skill) {
        ui.notifications.error(`Cant find skill for Actor: ${actor.name}, Skill-Group-Key: ${skillGroup}, Skill-Key: ${skillKey}. Please check your skills tab.`);
        return
    }
    console.log(actor)
    console.log(skillGroup);

    var skillValue = skill.value;
    var skillLabel = skill.label;   
    console.log(skillValue); 

    if (!skillLabel) {
        ui.notifications.warn("This attribute (attribute-key: " + skillKey + ") has no attribute label!")
        skillLabel = "Attribut"
    }
    if (!skillValue) {
        ui.notifications.error("This attribute (attribute-key: " + skillKey + ") has no attribute value!");
        return
    }
    skillValue = parseInt(skillValue);
    
    async function executeRoll(html) {
        const formElement = html[0].querySelector('form');
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.toObject();

        const modifier = parseInt(formDataObject.modifier);
        const modifiedValue = skillValue + modifier

        // depending on if there was a value != 0 the modifier will be shown in the chat message by appending the variable modifierString to it

        let modifierString = '';
        if (modifier > 0) {modifierString = " + " + modifier + " = " + modifiedValue}; 
        if (modifier < 0) {modifierString = modifier + " = " + modifiedValue};

        let rollHit = await new Roll("1d100").evaluate();
        let results_html = '';

        let rollMessage = `${characterName} würfelt auf <b>${skillLabel}</b>, sein ${skillLabel}-Wert beträgt <a class="inline-roll inline-result" data-tooltip="${skillLabel}">${skillValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${rollHit.result}</a> und `;
        let successStateLabel = "";
        if(rollHit.total <= skillValue + modifier){
            console.log("Success");
            
            if(rollHit.total <= ((skillValue + modifier) / 10)){
                // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[skillGroup][skill].value} ${actor.system.attributes[skillGroup][skill].label}`
                results_html = rollMessage + ` hat damit einen <b>kritischen Erfolg</b>!`;
                successStateLabel = "Kritischer Erfolg!"
            }else{
                // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[skillGroup][skill].value} ${actor.system.attributes[skillGroup][skill].label}`
                results_html = rollMessage + ` ist damit <b>erfolgreich</b>! `;
                successStateLabel = "Erfolg!"
            }
        }else{
            console.log("Fail");
            // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[skillGroup][skill].value}`;
            results_html = rollMessage + ` ist damit <b>nicht erfolgreich</b>!`;
            successStateLabel = "Fehlschlag!"
        }
        let rollDisplay = `</br></br><div class="dice-roll"><div class="dice-result"><div class="dice-formula">1d100: <i class="fas fa-dice-d20"></i>${rollHit.result}</div><div class="dice-tooltip"><section class="tooltip-part"><div class="dice"><header class="part-header flexrow"><span class="part-formula">1d100</span><span class="part-total">${rollHit.result}</span></header><ol class="dice-rolls"><li class="roll die d100">${rollHit.result}</li></ol></div></section></div><h4 class="dice-total">${successStateLabel}</h4></div></div></div>`
        results_html = results_html + rollDisplay

        ChatMessage.create({
            user: game.user._id,
            sound: CONFIG.sounds.dice,
            //speaker: ChatMessage.getSpeaker({token: actor}),
            content: results_html
        });
    }

    const form = '<form><label>Modifier: <input name="modifier" type="string" value="0"/></label>' + '</br></br>Ein positiver Modifier erleichtert den Wurf, ein negativer Modifier erschwert ihn.</br></br>' + 
    '</form>';

    new Dialog({
        title: "Skill Check: Gib hier den Roll-Modifier vom GM ein",
        content: form,
        buttons: {
            submit: {label: "Submit", callback: executeRoll},
            cancel: {label: "Cancel"},
        },
    }).render(true);
    return null;
}

export async function weaponRoll (actorid, itemid) {
    console.log("WEAPON ROLL");
    const itemOwner = await Actor.get(actorid);
    const item = itemOwner.items.get(itemid);

    if (item.type != "weapon") throw new Error("weaponRoll(): item is not a weapon.");

    if (!item.system.skill) {
        ui.notifications.warn("No skill link has been set. Please choose a skill link");
        return
    }

    const skillSplit = item.system.skill.split(".");
    const skillGroup = skillSplit[0];
    const skillKey = skillSplit[1];

    const skill = itemOwner.system.attributes[skillGroup][skillKey]
    if (!skill && item.system.skill != "") {
    ui.notifications.error("It appears that the linked attribute (attribute-key: " + skillKey + ") has been deleted from the attributes of character " + itemOwner.name + ". Please choose a new link.");
    return
    }

    const skillValue = parseInt(skill.value);
    var skillLabel = item.name;
    
    const characterName = itemOwner.name;

    if (!skillValue) {
    ui.notifications.error("The attribute linked to this item (attribute-key: " + skillKey + ") has no attribute value!");
    return
    }

    var baseDamageFormula = item.system.attributes["damage"]["base"].value;
    if (!baseDamageFormula) { 
        ui.notifications.error("This action (action-name: " + skillLabel + ") has no damage value! Roll aborted.");
        return
    }
    
    async function executeRoll(html) {
        console.log(baseDamageFormula);
        // get the modifier value from the HTML FORM
        const formElement = html[0].querySelector('form');
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.toObject();
        const modifier = parseInt(formDataObject.modifier);
        const modifiedValue = skillValue + modifier; 

        // depending on if there was a modifier-value != 0 the modifier will be shown in the chat message by appending the variable modifierString to it
        let modifierString = "";
        if (modifier > 0) {modifierString = " + " + modifier + " = " + modifiedValue}; 
        if (modifier < 0) {modifierString = modifier + " = " + modifiedValue};

        const rollHit = await new Roll("1d100").evaluate();

        let hitRollMessage = `${characterName} setzt <b>${skillLabel}</b> ein, der Roll-Wert von ${skillLabel} beträgt <a class="inline-roll inline-result" data-tooltip="${skillLabel}">${skillValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${rollHit.result}</a> und `;
        let successStateLabel = "";
        let successState = "";  
        const FAIL = -1;
        const SUCCESS = 0;
        const CRIT = 1;
        

        if (rollHit.total <= skillValue + modifier) {
            console.log("Success");

            if(rollHit.total <= ((skillValue + modifier) / 10)){
                // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                hitRollMessage += ` hat damit einen <b>kritischen Erfolg</b>!`;
                successStateLabel = "Kritischer Erfolg!"
                successState = CRIT;
            }else{
                // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                hitRollMessage += ` ist damit <b>erfolgreich</b>! `;
                successStateLabel = "Erfolg!"
                successState = SUCCESS;
            }
            
            // only evaluate the damage if appliesDamage == true;

            var damageRollMessage = `</br>${characterName} würfelt ${baseDamageFormula} auf Schaden:`
            const damageRoll = await new Roll(baseDamageFormula).evaluate();
            
            if (successState == CRIT) {
                // evaluate crit
                var damageValue = damageRoll.total * 2;
                console.log(damageValue)
            } else if (successState == SUCCESS) {
                // evaluate normal dmg
                damageValue = damageRoll.total;
            }

            // For each rolled dice, add its result to the resulting chat message via diceDisplay
            let diceDisplay = ``;
            for (let dice of damageRoll.dice[0].results) {
                diceDisplay = diceDisplay + ` <i class="fas fa-dice-d20"></i>${dice.result}`
            }
            var damageRollDisplay =`</br></br>
                                    <div class="dice-roll">
                                        <div class="dice-result">
                                            <div class="dice-formula">
                                                ${baseDamageFormula}: ${diceDisplay}
                                            </div>
                                            <div class="dice-tooltip">
                                                <section class="tooltip-part">
                                                    <div class="dice">
                                                        <header class="part-header flexrow">
                                                            <span class="part-formula">1d100</span>
                                                            <span class="part-total">${rollHit.result}</span>
                                                        </header>
                                                        <ol class="dice-rolls">
                                                            <li class="roll die d100">${rollHit.result}</li>
                                                        </ol>
                                                    </div>
                                                </section>
                                            </div>
                                            <h4 class="dice-total">${damageValue} Schaden!</h4>
                                        </div>
                                    </div>`
        }
        else {
            console.log("Fail");
            // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[category][skill].value}`;
            hitRollMessage = hitRollMessage + ` ist damit <b>nicht erfolgreich</b>!`;
            successStateLabel = "Fehlschlag!"
            successState = FAIL;
            damageRollMessage = "";
            damageRollDisplay = "";
        }
        let hitRollDisplay =   `</br></br>
                                <div class="dice-roll">
                                    <div class="dice-result">
                                        <div class="dice-formula">
                                            1d100: <i class="fas fa-dice-d20"></i>${rollHit.result}
                                        </div>
                                        <div class="dice-tooltip">
                                            <section class="tooltip-part">
                                                <div class="dice">
                                                    <header class="part-header flexrow">
                                                        <span class="part-formula">1d100</span>
                                                        <span class="part-total">${rollHit.result}</span>
                                                    </header>
                                                    <ol class="dice-rolls">
                                                        <li class="roll die d100">${rollHit.result}</li>
                                                    </ol>
                                                </div>
                                            </section>
                                        </div>
                                        <h4 class="dice-total">${successStateLabel}</h4>
                                    </div>
                                </div>`

        ChatMessage.create({
            user: game.user._id,
            sound: CONFIG.sounds.dice,
            //speaker: ChatMessage.getSpeaker({token: actor}),
            content: hitRollMessage + hitRollDisplay + damageRollMessage + damageRollDisplay
        });

    }

    const form =   `<form>
                        <label>
                            Modifier: <input name="modifier" type="string" value="0"/>
                        </label>
                        <p>Ein positiver Modifier erleichtert den Wurf, ein negativer Modifier erschwert ihn.</p>
                    </form>`;

    new Dialog({
        title: "Skill Check: Gib hier den Roll-Modifier vom GM ein",
        content: form,
        buttons: {
            submit: {label: "Submit", callback: executeRoll},
            cancel: {label: "Cancel"},
        },
    }).render(true);

    return 0;
}

export async function actionRoll (actorid, itemid) {
    console.log("ACTION ROLL");
    const itemOwner = Actor.get(actorid);
    const item = itemOwner.items.get(itemid);  
    if (item.type != "action") throw new Error("actionRoll(): item is not an action."); 
    const characterName = itemOwner.name;
    const skillValue = parseInt(item.system.attributes.rollValue.value);
    const appliesDamage = item.system.attributes.appliesDamage.value;
    const skillLabel = item.name;

    if (!skillValue) {
        ui.notifications.error("This action (action-name: " + skillLabel + ") has no skill value!");
        return
    }

    if (appliesDamage) {
        var baseDamageFormula = item.system.attributes["damage"]["base"].value;
        if (!baseDamageFormula) { 
            ui.notifications.error("This action (action-name: " + skillLabel + ") has no damage value! Roll aborted.");
            return
        }
    }

    async function executeRoll(html) {
        console.log(baseDamageFormula);
        // get the modifier value from the HTML FORM
        const formElement = html[0].querySelector('form');
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.toObject();
        const modifier = parseInt(formDataObject.modifier);
        const modifiedValue = skillValue + modifier; 

        // depending on if there was a modifier-value != 0 the modifier will be shown in the chat message by appending the variable modifierString to it
        let modifierString = "";
        if (modifier > 0) {modifierString = " + " + modifier + " = " + modifiedValue}; 
        if (modifier < 0) {modifierString = modifier + " = " + modifiedValue};

        const rollHit = await new Roll("1d100").evaluate();

        let hitRollMessage = `${characterName} setzt <b>${skillLabel}</b> ein, der Roll-Wert von ${skillLabel} beträgt <a class="inline-roll inline-result" data-tooltip="${skillLabel}">${skillValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${rollHit.result}</a> und `;
        let successStateLabel = "";
        let successState = "";  
        const FAIL = -1;
        const SUCCESS = 0;
        const CRIT = 1;
        

        if (rollHit.total <= skillValue + modifier){
            console.log("Success");

            if(rollHit.total <= ((skillValue + modifier) / 10)){
                // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                hitRollMessage += ` hat damit einen <b>kritischen Erfolg</b>!`;
                successStateLabel = "Kritischer Erfolg!"
                successState = CRIT;
            }else{
                // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                hitRollMessage += ` ist damit <b>erfolgreich</b>! `;
                successStateLabel = "Erfolg!"
                successState = SUCCESS;
            }
            if (appliesDamage) {
                // only evaluate the damage if appliesDamage == true;

                var damageRollMessage = `</br>${characterName} würfelt ${baseDamageFormula} auf Schaden:`
                const damageRoll = await new Roll(baseDamageFormula).evaluate();
                
                if (successState == CRIT) {
                    // evaluate crit
                    var damageValue = damageRoll.total * 2;
                    console.log(damageValue)
                } else if (successState == SUCCESS) {
                    // evaluate normal dmg
                    damageValue = damageRoll.total;
                }

                // For each rolled dice, add its result to the resulting chat message via diceDisplay
                let diceDisplay = ``;
                for (let dice of damageRoll.dice[0].results) {
                    diceDisplay = diceDisplay + ` <i class="fas fa-dice-d20"></i>${dice.result}`
                }
                var damageRollDisplay =`</br></br>
                                        <div class="dice-roll">
                                            <div class="dice-result">
                                                <div class="dice-formula">
                                                    ${baseDamageFormula}: ${diceDisplay}
                                                </div>
                                                <div class="dice-tooltip">
                                                    <section class="tooltip-part">
                                                        <div class="dice">
                                                            <header class="part-header flexrow">
                                                                <span class="part-formula">1d100</span>
                                                                <span class="part-total">${rollHit.result}</span>
                                                            </header>
                                                            <ol class="dice-rolls">
                                                                <li class="roll die d100">${rollHit.result}</li>
                                                            </ol>
                                                        </div>
                                                    </section>
                                                </div>
                                                <h4 class="dice-total">${damageValue} Schaden!</h4>
                                            </div>
                                        </div>`
            }
        }
        else {
            console.log("Fail");
            // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[category][skill].value}`;
            hitRollMessage = hitRollMessage + ` ist damit <b>nicht erfolgreich</b>!`;
            successStateLabel = "Fehlschlag!"
            successState = FAIL;
            damageRollMessage = "";
            damageRollDisplay = "";
        }
        let hitRollDisplay =   `</br></br>
                                <div class="dice-roll">
                                    <div class="dice-result">
                                        <div class="dice-formula">
                                            1d100: <i class="fas fa-dice-d20"></i>${rollHit.result}
                                        </div>
                                        <div class="dice-tooltip">
                                            <section class="tooltip-part">
                                                <div class="dice">
                                                    <header class="part-header flexrow">
                                                        <span class="part-formula">1d100</span>
                                                        <span class="part-total">${rollHit.result}</span>
                                                    </header>
                                                    <ol class="dice-rolls">
                                                        <li class="roll die d100">${rollHit.result}</li>
                                                    </ol>
                                                </div>
                                            </section>
                                        </div>
                                        <h4 class="dice-total">${successStateLabel}</h4>
                                    </div>
                                </div>`

        ChatMessage.create({
            user: game.user._id,
            sound: CONFIG.sounds.dice,
            //speaker: ChatMessage.getSpeaker({token: actor}),
            content: hitRollMessage + hitRollDisplay + damageRollMessage + damageRollDisplay
        });

    }

    const form =   `<form>
                        <label>
                            Modifier: <input name="modifier" type="string" value="0"/>
                        </label>
                        <p>Ein positiver Modifier erleichtert den Wurf, ein negativer Modifier erschwert ihn.</p>
                    </form>`;

    new Dialog({
        title: "Skill Check: Gib hier den Roll-Modifier vom GM ein",
        content: form,
        buttons: {
            submit: {label: "Submit", callback: executeRoll},
            cancel: {label: "Cancel"},
        },
    }).render(true);

    return 0;
}
