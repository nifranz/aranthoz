function getSequenceHtml(index) {
    return `
    <div class="sequence">
        <input name="sequences.${index}.type" value="heal">
        <input name="sequences.${index}.target" value="self">
        <input name="sequences.${index}.roll" value="">
        <input name="sequences.${index}.animation" value="">
    </div>`
}
function getRollHtml(actionKey, rollKey) {
    return `
    <div class="roll">
        <input name="rolls.${rollKey}.key" value="${rollKey}">
        <input name="rolls.${rollKey}.value" value="">
    </div>`
}
function updateRolls(formData, document, actionKey) {
    const formRolls = foundry.utils.expandObject(formData)?.rolls || []
    const rolls = Object.values(formRolls).reduce((obj, v) => {
        let k = v["key"].trim();
        if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
        // delete v["key"];
        obj[k] = v;
        return obj;
      }, {});


    // remove Rolls that are no longer used
    for ( let k of Object.keys(document.system.actions[actionKey].rolls) ) {
        if ( !rolls.hasOwnProperty(k) ) rolls[`-=${k}`] = null;
    }

    // recombine form data
    formData = Object.entries(formData).filter(e => !e[0].startsWith("rolls")).reduce((obj, e) => {
        obj[e[0]] = e[1];
        return obj;
      }, {_id: document.id});

    formData[`system.actions.key1.rolls`] = rolls

    return formData
}
function updateSequences(formData, document, actionKey) {
    const formSequencesObject = foundry.utils.expandObject(formData)?.sequences || []
    const sequences = Object.values(formSequencesObject)
    // recombine form data
    formData = Object.entries(formData).filter(e => !e[0].startsWith("sequences")).reduce((obj, e) => {
        obj[e[0]] = e[1];
        return obj;
      }, {_id: document.id});
    formData[`system.actions.${actionKey}.sequences`] = sequences
    return formData
}
async function deleteSequence(event, app) {
    const a = event.currentTarget;
    const sequence = a.closest(".sequence");
    if ( sequence ) {
        sequence.parentElement.removeChild(sequence);
        await app._onSubmit(event);
    }
    app.render()
}
async function createSequence(event, app) {
    const form = app.form;
    const sequences = (app.object.system.actions[app.actionKey].sequences)
    let newSequence = document.createElement("div");

    newSequence.innerHTML = getSequenceHtml(sequences.length) // create inner html for the new sequence from template via getSequenceHtml
    newSequence = newSequence.children[0]

    form.appendChild(newSequence);
    await app._onSubmit(event);
}
function onClickSequenceControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch(action) {
        case "delete":
            deleteSequence(event, this)
            break;
        case "create":
            createSequence(event, this)
            break;
    }
}
async function deleteRoll(event, app) {
    const a = event.currentTarget;
    const rollKey = a.dataset.rollkey;
    const roll = a.closest(".sequence");
    if ( roll ) {
        roll.parentElement.removeChild(roll);
        await app._onSubmit(event);
    }
    app.render()
}
async function createRoll(event, app) {
    const form = app.form;
    const rolls = (app.object.system.actions[app.actionKey].rolls)

    let newKey = `roll${Object.keys(rolls).length + 1}`
    let newRoll = document.createElement("div");

    newRoll.innerHTML = getRollHtml(app.actionKey, newKey) // create inner html for the new Roll from template via getRollHtml
    newRoll = newRoll.children[0]

    form.appendChild(newRoll);
    await app._onSubmit(event);
}
function onClickRollControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch(action) {
        case "delete":
            deleteRoll(event, this)
            break;
        case "create":
            createRoll(event, this)
            break;
    }
}

export class ActionEditorSheet extends FormApplication {
    constructor(object, actionKey) {
        super(object);
        this.item = object
        this.actionKey = actionKey
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if ( !this.isEditable ) return;
        
        html.find("._sequence-control").on("click", onClickSequenceControl.bind(this));
        html.find("._roll-control").on("click", onClickRollControl.bind(this));

    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/aranthoz/templates/aranthoz/item-sheet/actions/action-edit.html",
            resizable: true,
            submitOnChange: true,
            submitOnClose: true,
            closeOnSubmit: false,
        });
    }

    /** @override */
    async getData(options) {  console.log("getData()");
        // sending data to the template 
        const context = await super.getData(options);
        context.bools = {} //  initiate bools variable for later use

        context.systemData = context.object.system
        
        context.action = context.systemData.actions[this.actionKey]
        context.action.key = this.actionKey
        
        context.sequences = context.action.sequences
        context.action.rollkeys = Object.keys(context.action.rolls)
        
        context.bools.rollIsEmpty = Object.keys(context.action.rolls).length == 0

        // add sequence data
        context.sequenceData = {
            types: [
                { key: "heal", label: "Heal" },
                { key: "damage", label: "Damage" }
            ],
            targets: [
                { key: "self", label: "Self" },
                { key: "selected", label: "Selected" }
            ],
        }
        
        // everything below is not needed if item has no actor
        const item = context.object
        if (!item.actor) return context 

        // add item specific information to hbs context
        context.ownerId = item.actor._id; 
        context.ownerRessource = item.actor.system.identityAttributes.ressource;
        context.ownerRessource = context.ownerRessource.charAt(0).toUpperCase() + context.ownerRessource.slice(1);

        return context
    }

    /** @override */
    _onSubmit(event) { console.log("_onSubmit()")
        // before the form data is submitted for updating the object, 
        // some constraints need to be checked below

        const el = event.currentTarget;
        if ( !el ) return

        if ( el.classList.contains("_roll-key") ) {
            // check key constraints
            let val = el.value;
            if ( /[\s\.]/.test(val) ) {
                ui.notifications.error("Roll keys may not contain spaces or periods!");
                return this.render()
            }
        } 
        else if ( el.classList.contains("_roll-formula") ) {
            // check roll-formula constraints
            let val = el.value;
            if ( val && !(/^[1-9]\d*d[1-9]\d*$/.test(val))) {
                ui.notifications.error("The formula must match the pattern of the following example: 1d10");
                return this.render()
            }
        } 
        else if ( el.classList.contains("_action-cost") ) {
            // check action-cost constraints
            let val = el.value;

            // no constraints checked 
        } 
        else if ( el.classList.contains("_action-roll-value") ) {
            // check action-cost constraints
            let val = el.value;

            // no constraints checked
        }

        // if every check has been successfull continue with submit
        super._onSubmit(event)
    }

    /** @override */
    async _updateObject(event, data) {  console.log("_updateObject()");
        await this.object.update(data)
        this.render(); // re-render the application sheet upon changes
    }

    /** @override */
    _getSubmitData(updateData) { console.log("_getSubmitData()");
        let formData = super._getSubmitData(updateData);
        formData = updateSequences(formData, this.object, this.actionKey);

        formData = updateRolls(formData, this.object, this.actionKey);

        let presentRollKeys = []
        for (let roll of Object.values(formData[`system.actions.${this.actionKey}.rolls`])) {
            if (roll) {
                presentRollKeys.push(roll.key)
            }
        }

        for (let seq of Object.values(formData[`system.actions.${this.actionKey}.sequences`])) {
            if (seq) {
                if (!presentRollKeys.includes(seq.roll)) {
                    seq.roll = undefined
                }
            }
        }

        return formData
    }
}