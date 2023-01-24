

export async function aranthozSkillRoll (actorid, skillGroup, skillKey) {
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
    
    async function handleSubmit(html) {
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
            submit: {label: "Submit", callback: handleSubmit},
            cancel: {label: "Cancel"},
        },
    }).render(true);
    return null;
}
