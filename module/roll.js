export let Rolls = {}

Rolls.attributeRoll = async function (actorId, attributeGroup, attributeKey) {
    // defining some variables and checking validity of the roll values
    const actor = await Actor.get(actorId);
    const attribute = actor.system.attributes[attributeGroup][attributeKey];
    let attributeValue = attribute.value;
    let attributeLabel = attribute.label;

    const characterName = actor.name;

    if (!attributeLabel) {
        ui.notifications.warn("This attribute (attribute-key: " + attributeKey + ") has no attribute label!")
        attributeLabel= "Attribut"
    }
    if (!attributeValue) {
        ui.notifications.error("This roll can't be executed, since the selected attribute has no attribute value! (attribute-key: " + attributeKey + ")");
        return
    }
    attributeValue = parseInt(attributeValue);

    // creating and displaying a form to the user; here he can set a modifier if needed
    const form = '<form><label>Modifier: <input name="modifier" type="string" value="0"/></label>' + '</br></br>Ein positiver Modifier erleichtert den Wurf, ein negativer Modifier erschwert ihn.</br></br>' + '</form>';

    new Dialog({
        title: "Skill Check: Gib hier den Roll-Modifier vom GM ein",
        content: form,
        buttons: {
            submit: {label: "Submit", callback: executeRoll},
            cancel: {label: "Cancel"},
        },
    }).render(true);
    return null;

    async function executeRoll(html) {
        const formElement = html[0].querySelector('form');
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.object;

        const modifier = parseInt(formDataObject.modifier);
        const modifiedValue = attributeValue + modifier

        // depending on if there was a value != 0 the modifier will be shown in the chat message by appending the variable modifierString to it

        let modifierString = '';
        if (modifier > 0) {modifierString = " + " + modifier + " = " + modifiedValue}; 
        if (modifier < 0) {modifierString = modifier + " = " + modifiedValue};

        let rollHit = await new Roll("1d100").evaluate();
        let results_html = '';

        let rollMessage = `${characterName} würfelt auf <b>${attributeLabel}</b>, sein ${attributeLabel}-Wert beträgt <a class="inline-roll inline-result" data-tooltip="${attributeLabel}">${attributeValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${rollHit.result}</a> und `;
        let successStateLabel = "";
        if(rollHit.total <= attributeValue + modifier){
            console.log("Success");
            
            if(rollHit.total <= ((attributeValue + modifier) / 10)){
                // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[attributeGroup][attribute].value} ${actor.system.attributes[attributeGroup][attribute].label}`
                results_html = rollMessage + ` hat damit einen <b>kritischen Erfolg</b>!`;
                successStateLabel = "Kritischer Erfolg!"
            }else{
                // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[attributeGroup][attribute].value} ${actor.system.attributes[attributeGroup][attribute].label}`
                results_html = rollMessage + ` ist damit <b>erfolgreich</b>! `;
                successStateLabel = "Erfolg!"
            }
        }else{
            console.log("Fail");
            // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[attributeGroup][attribute].value}`;
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

}

Rolls.weaponRoll = async function (actorid, itemid) {
    console.log("WEAPON ROLL");
    const itemOwner = await Actor.get(actorid);
    const item = itemOwner.items.get(itemid);

    if (item.type !== "weapon") throw new Error("weaponRoll(): item is not a weapon.");

    if (!item.system.skill) {
        ui.notifications.warn("No skill link has been set. Please choose a skill link");
        return
    }

    const skillSplit = item.system.skill.split(".");
    const skillGroup = skillSplit[0];
    const skillKey = skillSplit[1];

    const skill = itemOwner.system.attributes[skillGroup][skillKey]
    if (!skill && item.system.skill !== "") {
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
Rolls.skillRoll = async function (actorid, itemid) {
    console.log("SKILL ROLL");
    const itemOwner = Actor.get(actorid);
    const item = itemOwner.items.get(itemid);  
    if (item.type != "skill") throw new Error("skillRoll(): item is not a skill."); 
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


Rolls.actionRoll = async function (actorid, itemid, actionKey) {  console.log("actionRoll()")
    const itemOwner = Actor.get(actorid);
    const item = itemOwner.items.get(itemid);
    const action = item.system.actions[actionKey]
    const rollType = item.type
    console.log(item, action, rollType)

    if (rollType !== "skill" && rollType !== "weapon") return ui.notifications.error(`Rolls on ${rollType}s are not yet supported!`)


    // assert that all required values are set and roll is executable
    if (!action.sequences.length) return ui.notifications.error("This action has no sequences!");
    for (let seq of action.sequences) {
        if (!seq.roll) return ui.notifications.error(`At least one sequence of the action has no roll assigned!`)
        if (!action.rolls[seq.roll]) return ui.notifications.error(`At least one sequence of the action has an invalid roll assigned!`)
        if (!action.rolls[seq.roll].value) return ui.notifications.error(`${seq.roll}, which is used by at least one sequence, has no forumla!`)
    }
    switch (rollType){ // item type specific assertions
        case "weapon":
            if (!action.attributeLink) return ui.notifications.error("No attribute has been linked to this action!")
            else if (!itemOwner.system.attributes[action.attributeLink.split(".")[0]][action.attributeLink.split(".")[1]]) return ui.notifications.error("The linked attribute is not present for the item owner!")
            break;
        case "skill":
            if(!action.rollValue) return ui.notifications.error("No roll value has been set!")
            if(!action.cost.onSuccess) return ui.notifications.error("No roll success cost has been set!")
            if(!action.cost.onFailure) return ui.notifications.error("No roll failure cost has been set!")
            break;
    }
    /**
     * ACTION ROLL WORKFLOW
     * 1. gather roll value
     * - for weapons:
     *      roll Value and attribute name / key from linked attribute 
     * - for skills:
     *      roll Value, cost (success and failure) from sheet
     * - for both:
     *      ggf. add modifier from the form-prompt
     * 2. execute success check:
     * - for weapons:
     *      if successfull, execute sequences
     *      if failure, render chat message
     * - for skills:
     *      if successfull, deduct successcost and execute sequences
     *      if unsuccessfull, deduct failurecost and render chat message
     * 3. execute sequences (if above check is successfull)
     * - gather the roll formulas used by any roll that is linked to a sequence and get roll formula result
     * - for each sequence:
     *      gather type, target, and roll result from linked roll
     *      execute sequence result on all targets by using the type (dmg or heal) and roll result
     * 4. render chat message
     * - content depends on success or failure of the success check
     */

    // get roll modifier
    const rollModifier = await promptRollModifier() 

    // get checkValue
    let checkValue
    switch (rollType){
        case "weapon":
            let attributeGroup = (action.attributeLink).split(".")[0]
            let attributeKey = (action.attributeLink).split(".")[1]
            checkValue = parseInt(itemOwner.system.attributes[attributeGroup][attributeKey].value)
            break;
        case "skill":
            checkValue = parseInt(action.rollValue)
            break;
    }
    console.log(rollModifier, checkValue)

    // execute success check
    const successCheckRoll = await new Roll("1d100").evaluate({async: true});
    const successCheckRollResult = successCheckRoll.total
    console.log(successCheckRollResult, rollModifier + checkValue)

    const rollSuccessul = successCheckRollResult <= rollModifier + checkValue
    let chatMessageContent
    if (rollSuccessul) {
        chatMessageContent = getSuccessMessageContent()
        console.log("success")
    } else {
        chatMessageContent = getFailureMessageContent()
        console.log("failure")
    }
    console.log(chatMessageContent)

    // execute roll evaluation
    let rolls = JSON.parse(JSON.stringify(action.rolls))
    for (let r of Object.values(rolls)) {
        if (r.value) {
            let roll = await new Roll(r.value).evaluate({async: true})
            r.rollTotal = roll.total
        }
    }

    console.log(action.rolls)

    ChatMessage.create({
        user: game.user._id,
        sound: CONFIG.sounds.dice,
        //speaker: ChatMessage.getSpeaker({token: actor}),
        content: chatMessageContent
    });

    function getSequenceMessage(seq) {
        return `<div>${Actor.name} ${seq.type}s ${seq.targets}</div>`
    }
    
    function getSuccessMessageContent() {
        let modifierString = rollModifier ? ( rollModifier < 0 ? (" - " + (-1 * rollModifier)) : (" + " + rollModifier) ) : ""
        let rollStatus = `<p>${itemOwner.name} setzt <b>${item.name}</b> ein. Der Roll-Wert von ${item.name} beträgt <a class="inline-roll inline-result" data-tooltip="${item.name}">${checkValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${ successCheckRollResult }</a> und ist damit erfolgreich!</p>`
        
        let sequenceMessages = ""
        for (let seq of action.sequences) {
            sequenceMessages += getSequenceMessage(seq)
        }
        let message = `
        <div class="rollMessage">
            <div>${rollStatus}</div>
            <div><p><strong>rollValue:</strong> ${checkValue}</p></div>
            <div class="sequences">${sequenceMessages}</div>
        </div>`
        return message; 
    }

    function getFailureMessageContent() {
        let modifierString = rollModifier ? ( rollModifier < 0 ? (" - " + (-1 * rollModifier)) : (" + " + rollModifier) ) : ""
        let rollStatus = `<p>${itemOwner.name} setzt <b>${item.name}</b> ein. Der Roll-Wert von ${item.name} beträgt <a class="inline-roll inline-result" data-tooltip="${item.name}">${checkValue}${modifierString}</a>. Er würfelt <a class="inline-roll inline-result" data-tooltip="1d100"><i class="fas fa-dice-d20"></i>${ successCheckRollResult }</a> und ist damit erfolgreich!</p>`
        return rollStatus; 
    }
    return 
    // return ui.notifications.info("Roll success!")
    if (item.type != "skill") throw new Error("skillRoll(): item is not a skill."); 
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


    function promptRollModifier() {
        const form =   `<form>
                            <label>
                                Modifier: <input name="modifier" type="number" value="0"/>
                            </label>
                            <p>Ein positiver Modifier erleichtert den Wurf, ein negativer Modifier erschwert ihn.</p>
                        </form>`;
        return new Promise((resolve,reject) => {
            const dialog = new Dialog({
                title: "Skill Check: Gib hier den Roll-Modifier vom GM ein",
                content: form,
                _onKeyDown: {
                    callback: (html) => {
                        const formElement = html[0].querySelector('form');
                        const formData = new FormDataExtended(formElement);
                        const formDataObject = formData.object;
                        const modifier = parseInt(formDataObject.modifier);
                        resolve(modifier);
                    }
                },
                buttons: {
                    submit: {label: "Submit", callback: (html) => {
                        const formElement = html[0].querySelector('form');
                        const formData = new FormDataExtended(formElement);
                        const formDataObject = formData.object;
                        const modifier = parseInt(formDataObject.modifier);
                        resolve(modifier);
                    }},
                    cancel: {label: "Cancel", callback: () => {
                        resolve(null)
                    }}
                },
                default: 'submit',
                close: () => resolve(null)
            }).render(true);
            console.log(dialog)
        })
    }

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
