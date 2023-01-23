export class EntitySheetHelper {

  static createRollMessage() {

  }

  /**
   * Check if an item is in the inventory of an actor and if so, return the _id of the actor object. Else return undefined.
   * @param {String} itemId    The itemId of the item to be checked
   */

  static getItemOwnerId(itemId) {
    // loop through all actors
    for (var a of game.actors._source) {
      // loop through all items per actor
      for (var i of a.items) {
        // if the item._id matches an item._id of an actor, return the actor._id
        if (i._id == itemId) {
          return a._id;
        }
      }
    }
    return undefined; // if no matching item._id has been found in the items of all actors return undefined
  }

  /* -------------------------------------------- */

  /**
   * Returns an array holding every attribute (as a string) of a given actor, referenced by actor id 
   * @param {String} actorId    The actorId of the actor
   */

  static getActorAttributes(actorId) {
    // Get the attribute object of the actor
    var ownerAttributes = Actor.get(actorId).system.attributes

    // Initilialize attribute list for later
    var ownerAttributeList = []

    // Loop through all attribute groups
    var attributeGroups = Object.entries(ownerAttributes);    
    for (var group of attributeGroups) {
      var attributes = Object.keys(group[1])      
      // Loop through the attributes
      for (var attribute of attributes) {
        // Append an attribute to the attribute list
        ownerAttributeList.push(attribute)
      }
    }
    return ownerAttributeList
  }

  /* -------------------------------------------- */

  static getActorSheetData(data) {

  }

  static getAttributeData(data) {

    // Determine attribute type.
    for ( let attr of Object.values(data.system.attributes) ) {
      if ( attr.dtype ) {
        attr.isCheckbox = attr.dtype === "Boolean";
        attr.isResource = attr.dtype === "Resource";
        attr.isFormula = attr.dtype === "Formula";
        attr.isReadonly = attr.readonly === "True";
      }
    }

    // Initialize ungrouped attributes for later.
    data.system.ungroupedAttributes = {};

    // Build an array of sorted group keys.
    const groups = data.system.groups || {};
    let groupKeys = Object.keys(groups).sort((a, b) => {
      let aSort = groups[a].label ?? a;
      let bSort = groups[b].label ?? b;
      return aSort.localeCompare(bSort);
    });

    // Iterate over the sorted groups to add their attributes.
    for ( let key of groupKeys ) {
      let group = data.system.attributes[key] || {};

      // Initialize the attributes container for this group.
      if ( !data.system.groups[key]['attributes'] ) data.system.groups[key]['attributes'] = {};

      // Sort the attributes within the group, and then iterate over them.
      Object.keys(group).sort((a, b) => a.localeCompare(b)).forEach(attr => {
        // Avoid errors if this is an invalid group.
        if ( typeof group[attr] != "object" || !group[attr]) return;
        // For each attribute, determine whether it's a checkbox or resource, and then add it to the group's attributes list.
        group[attr]['isCheckbox'] = group[attr]['dtype'] === 'Boolean';
        group[attr]['isResource'] = group[attr]['dtype'] === 'Resource';
        group[attr]['isFormula'] = group[attr]['dtype'] === 'Formula';
        data.system.groups[key]['attributes'][attr] = group[attr];
      });
    }

    // Sort the remaining attributes.
    const keys = Object.keys(data.system.attributes).filter(a => !groupKeys.includes(a));
    keys.sort((a, b) => a.localeCompare(b));
    for ( const key of keys ) data.system.ungroupedAttributes[key] = data.system.attributes[key];

    // Modify attributes on items.
    if ( data.items ) {
      data.items.forEach(item => {
        // Iterate over attributes.
        for ( let [k, v] of Object.entries(item.system.attributes) ) {
          // Grouped attributes.
          if ( !v.dtype ) {
            for ( let [gk, gv] of Object.entries(v) ) {
              if ( gv.dtype ) {
                // Add label fallback.
                if ( !gv.label ) gv.label = gk;
                // Add formula bool.
                if ( gv.dtype === "Formula" ) {
                  gv.isFormula = true;
                }
                else {
                  gv.isFormula = false;
                }
              }
            }
          }
          // Ungrouped attributes.
          else {
            // Add label fallback.
            if ( !v.label ) v.label = k;
            // Add formula bool.
            if ( v.dtype === "Formula" ) {
              v.isFormula = true;
            }
            else {
              v.isFormula = false;
            }
          }
        }
      });
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static onSubmit(event) {
    console.log("yey")
    // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
    if ( event.currentTarget ) {
      // Exit early if this isn't a named attribute.
      if ( (event.currentTarget.tagName.toLowerCase() === 'input') && !event.currentTarget.hasAttribute('name')) {
        console.log("submit")
        return false;
      }

      let attr = false;
      // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
      const el = event.currentTarget;
      if ( el.classList.contains("attribute-key") ) {
        let val = el.value;
        let oldVal = el.closest(".attribute").dataset.attribute;
        let attrError = false;
        // Prevent attributes that already exist as groups.
        let groups = document.querySelectorAll('.group-key');
        for ( let i = 0; i < groups.length; i++ ) {
          if (groups[i].value === val) {
            ui.notifications.error(game.i18n.localize("SIMPLE.NotifyAttrDuplicate") + ` (${val})`);
            el.value = oldVal;
            attrError = true;
            break;
          }
        }
        // Handle value and name replacement otherwise.
        if ( !attrError ) {
          oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
          attr = $(el).attr('name').replace(oldVal, val);
        }
      }

      // Return the attribute key if set, or true to confirm the submission should be triggered.
      return attr ? attr : true;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create":
        return EntitySheetHelper.createAttribute(event, this);
      case "delete":
        return EntitySheetHelper.deleteAttribute(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an skill submit button to modify the linked skill
   * @param {MouseEvent} event    The originating left click event
   */
    static async onSkillChange(event) {
      event.preventDefault();
      const a = event.currentTarget;
      const formElements = Array.from(this.form.elements) // all HTML Elements in the current item form window
      const inputElement = formElements.filter(el => el.classList.contains("skill-select"))[0] // the input HTML element of class .skill-field

      // define the variables of interest to be used later
      const itemId = this.object._id // the _id of the item viewed
      const skillKey = inputElement.value // the attributeKey of the skill to be linked from the inputElement

      console.log("skillKey: " + skillKey)
      console.log("itemId: " + itemId)

      // get the actor that owns the item of item id 
      // by accessing all actors and filter them for the unique actor that stores the item that matches the item id of the viewed item
      var itemOwnerId = EntitySheetHelper.getItemOwnerId(itemId)
      if(itemOwnerId) {
        const item = Actor.get(itemOwnerId).items.get(itemId)
        if (skillKey != "none") {
          item.update({"system.skill":skillKey}) 
        } else {
          item.update({"system.skill":""}) 
        }
      } else {
        new Dialog({
          title: "Achtung!",
          content: "Du hast ein Item ausgewählt, dass sich nicht in deinem Inventar befindet. Bitte öffne ein Item aus deinem Inventar und versuche es erneut.",
          buttons: {
              submit: {label: "Got it!"}
          }
        }).render(true);
      }
    }

    static async onSkillSubmit(event) {
      event.preventDefault();
      const a = event.currentTarget;
      const formElements = Array.from(this.form.elements) // all HTML Elements in the current item form window
      const inputElement = formElements.filter(el => el.classList.contains("skill-field"))[0] // the input HTML element of class .skill-field
      console.log(formElements)
      // define the variables of interest to be used later
      const itemId = this.object._id // the _id of the item viewed
      const skillKey = inputElement.value // the attributeKey of the skill to be linked from the inputElement

      console.log("skillKey: " + skillKey)
      console.log("itemId: " + itemId)      

      // get the actor that owns the item of item id 
      // by accessing all actors and filter them for the unique actor that stores the item that matches the item id of the viewed item

      var itemOwnerId = EntitySheetHelper.getItemOwnerId(itemId)

      if(itemOwnerId) {
        // if an item owner exists check if the owner has the given skill
        const actor = Actor.get(itemOwnerId)
        const item = actor.items.get(itemId)
        const attributes = actor.system.attributes
        console.log(attributes)
        console.log("attributes")
        console.log("Item OwnerID: " + itemOwnerId)
        console.log(item)
        var hasSkill = false
        for (var g of Object.entries(attributes)) {
           if (g[1][skillKey]) hasSkill = true
        }

        // if the owner has the skill update the item, if not display an error message
        if (hasSkill) {
          item.update({"system.skill":skillKey})
        } else {
          new Dialog({
            title: "Achtung!",
            content: 'Der Charakter besitzt den Skill "' + skillKey + '" nicht.' ,
            buttons: {
                submit: {label: "Got it!"}
            }
          }).render(true);
        }

      }
      else {
        new Dialog({
          title: "Achtung!",
          content: "Du hast ein Item ausgewählt, dass sich nicht in deinem Inventar befindet. Bitte öffne ein Item aus deinem Inventar und versuche es erneut.",
          buttons: {
              submit: {label: "Got it!"}
          }
        }).render(true);
      }

    }
  
  /* -------------------------------------------- */

  /**
   * Listen for click events and modify attribute groups.
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeGroupControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch ( action ) {
      case "create-group":
        return EntitySheetHelper.createAttributeGroup(event, this);
      case "delete-group":
        return EntitySheetHelper.deleteAttributeGroup(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
  static onAttributeRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.closest(".attribute").querySelector(".attribute-label")?.value;
    const chatLabel = label ?? button.parentElement.querySelector(".attribute-key").value;
    const shorthand = game.settings.get("aranthoz", "macroShorthand");

    // Use the actor for rollData so that formulas are always in reference to the parent actor.
    const rollData = this.actor.getRollData();
    let formula = button.closest(".attribute").querySelector(".attribute-value")?.value;

    // If there's a formula, attempt to roll it.
    if ( formula ) {
      let replacement = null;
      if ( formula.includes('@item.') && this.item ) {
        let itemName = this.item.name.slugify({strict: true}); // Get the machine safe version of the item name.
        replacement = !!shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }

      // Create the roll and the corresponding message
      let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`
      });
    }
  }

  /* -------------------------------------------- *

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
    static onAranthozAttributeRoll(event) {
      event.preventDefault();
      console.log(event)
      const button = event.currentTarget;
      const category = button.getAttribute("data-group")
      const skillKey = button.getAttribute("data-key")
      const skillValue = parseInt(button.getAttribute("data-value"))
      var skillLabel = button.getAttribute("data-label")
      const characterName = "Valentin"

      if (!skillLabel) {
        ui.notifications.warn("This attribute (attribute-key: " + skillKey + ") has no attribute label!")
        skillLabel = "Attribut"
      }
      if (!skillValue) {
        ui.notifications.error("This attribute (attribute-key: " + skillKey + ") has no attribute value!");
        return
      }

      console.log(skillValue)

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
                  // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                  results_html = rollMessage + ` hat damit einen <b>kritischen Erfolg</b>!`;
                  successStateLabel = "Kritischer Erfolg!"
              }else{
                  // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                  results_html = rollMessage + ` ist damit <b>erfolgreich</b>! `;
                  successStateLabel = "Erfolg!"
              }
          }else{
              console.log("Fail");
              // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[category][skill].value}`;
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

    static onAranthozItemRoll(event) {
      event.preventDefault();
      console.log(event)
      const button = event.currentTarget;
      const itemID = button.getAttribute("data-id")
      const itemOwnerID = button.getAttribute("data-actor-id")

      const itemOwner = Actor.get(itemOwnerID)
      const item = itemOwner.items.get(itemID)
      const skillKey = item.system.skill

      if (!skillKey) {
        ui.notifications.warn("No skill link has been set. Please choose a skill link");
        return
        

      }

      const skill = itemOwner.system.attributes['handeln'][skillKey]
      if (!skill && item.skill != "") {
        ui.notifications.error("It appears that the linked attribute (attribute-key: " + skillKey + ") has been deleted from the attributes of character " + itemOwner.name + ". Please choose a new link.");
        return
      }

      const skillValue = parseInt(skill.value)
      var skillLabel = skill.label
      
      const characterName = itemOwner.name

 

      if (!skillLabel) {
        ui.notifications.warn("The attribute linked to this item (attribute-key: " + skillKey + ") has no attribute label!")
        skillLabel = "Attribut"
      }

      if (!skillValue) {
        ui.notifications.error("The attribute linked to this item (attribute-key: " + skillKey + ") has no attribute value!");
        return
      }



      console.log(skillValue)

      async function handleSubmit(html) {
        console.log("ye")
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
          let successState = 0;
          if(rollHit.total <= skillValue + modifier){
              console.log("Success");

              var itemBaseDamageFormula = item.system.attributes['damage']['base'].value
              console.log(itemBaseDamageFormula)
              if (itemBaseDamageFormula) {
                let rollDamage = await new Roll(itemBaseDamageFormula).evaluate();
                console.log(rollDamage.total)
              }              
              
              if(rollHit.total <= ((skillValue + modifier) / 10)){
                  console.log("crit")
                  // results_html = `${characterName} has a critical success with ${rollHit.result} ` + "<" + ` ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                  results_html = rollMessage + ` hat damit einen <b>kritischen Erfolg</b>!`;
                  successStateLabel = "Kritischer Erfolg!"
                  successState = 2;
              }else{
                  // results_html = `${characterName} is successful with ${rollHit.result}  + "<" + ${actor.system.attributes[category][skill].value} ${actor.system.attributes[category][skill].label}`
                  results_html = rollMessage + ` ist damit <b>erfolgreich</b>! `;
                  successStateLabel = "Erfolg!"
                  successState = 1;
              }

          }else{
              console.log("Fail");
              // results_html = `${characterName} failed with ${rollHit.result} ` + ">" + ` ${actor.system.attributes[category][skill].value}`;
              results_html = rollMessage + ` ist damit <b>nicht erfolgreich</b>!`;
              successStateLabel = "Fehlschlag!"
              successState = 0;
          }
          let hitRollDisplay = `</br></br><div class="dice-roll"><div class="dice-result"><div class="dice-formula">1d100: <i class="fas fa-dice-d20"></i>${rollHit.result}</div><div class="dice-tooltip"><section class="tooltip-part"><div class="dice"><header class="part-header flexrow"><span class="part-formula">1d100</span><span class="part-total">${rollHit.result}</span></header><ol class="dice-rolls"><li class="roll die d100">${rollHit.result}</li></ol></div></section></div><h4 class="dice-total">${successStateLabel}</h4></div></div></div>`
          results_html = results_html + hitRollDisplay;
          
          // const cls = ChatMessage.implementation;
          // const chatData = {
          //   user: game.user.id,
          //   speaker: cls.getSpeaker()
          // };

          // const rolls = [];
          // roll = Roll.create("1d10", rollData);

          // chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;
          // chatData.rolls = rolls;
          // chatData.sound = CONFIG.sounds.dice;
          // chatData.content = rolls.reduce((t, r) => t + r.total, 0);
          // createOptions.rollMode = command;

          // ChatMessage.create({
          //   type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          //   rolls: rolls,
          //   chatData.sound = CONFIG.sounds.dice;
          //   chatData.content = rolls.reduce((t, r) => t + r.total, 0);
          //   createOptions.rollMode = command;
          // })

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

  /* -------------------------------------------- */

  /**
   * Return HTML for a new attribute to be applied to the form for submission.
   *
   * @param {Object} items  Keyed object where each item has a "type" and "value" property.
   * @param {string} index  Numeric index or key of the new attribute.
   * @param {string|boolean} group String key of the group, or false.
   *
   * @returns {string} Html string.
   */
  static getAttributeHtml(items, index, group = false) {
    // Initialize the HTML.
    let result = '<div style="display: none;">';
    // Iterate over the supplied keys and build their inputs (including whether they need a group key).
    for (let [key, item] of Object.entries(items)) {
      result = result + `<input type="${item.type}" name="system.attributes${group ? '.' + group : '' }.attr${index}.${key}" value="${item.value}"/>`;
    }
    // Close the HTML and return.
    return result + '</div>';
  }

  /* -------------------------------------------- */

  /**
   * Validate whether or not a group name can be used.
   * @param {string} groupName    The candidate group name to validate
   * @param {Document} document   The Actor or Item instance within which the group is being defined
   * @returns {boolean}
   */
  static validateGroup(groupName, document) {
    let groups = Object.keys(document.system.groups || {});
    let attributes = Object.keys(document.system.attributes).filter(a => !groups.includes(a));

    // Check for duplicate group keys.
    if ( groups.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for group keys that match attribute keys.
    if ( attributes.includes(groupName) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAttrDuplicate") + ` (${groupName})`);
      return false;
    }

    // Check for reserved group names.
    if ( ["attr", "attributes"].includes(groupName) ) {
      ui.notifications.error(game.i18n.format("SIMPLE.NotifyGroupReserved", {key: groupName}));
      return false;
    }

    // Check for whitespace or periods.
    if ( groupName.match(/[\s|\.]/i) ) {
      ui.notifications.error(game.i18n.localize("SIMPLE.NotifyGroupAlphanumeric"));
      return false;
    }
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Create new attributes.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttribute(event, app) {
    const a = event.currentTarget;
    const group = a.dataset.group;
    let dtype = a.dataset.dtype;
    const attrs = app.object.system.attributes;
    const groups = app.object.system.groups;
    const form = app.form;

    // Determine the new attribute key for ungrouped attributes.
    let objKeys = Object.keys(attrs).filter(k => !Object.keys(groups).includes(k));
    let nk = Object.keys(attrs).length + 1;
    let newValue = `attr${nk}`;
    let newKey = document.createElement("div");
    while ( objKeys.includes(newValue) ) {
      ++nk;
      newValue = `attr${nk}`;
    }

    // Build options for construction HTML inputs.
    let htmlItems = {
      key: {
        type: "text",
        value: newValue
      }
    };

    // Grouped attributes.
    if ( group ) {
      objKeys = attrs[group] ? Object.keys(attrs[group]) : [];
      nk = objKeys.length + 1;
      newValue = `attr${nk}`;
      while ( objKeys.includes(newValue) ) {
        ++nk;
        newValue =  `attr${nk}`;
      }

      // Update the HTML options used to build the new input.
      htmlItems.key.value = newValue;
      htmlItems.group = {
        type: "hidden",
        value: group
      };
      htmlItems.dtype = {
        type: "hidden",
        value: dtype
      };
    }
    // Ungrouped attributes.
    else {
      // Choose a default dtype based on the last attribute, fall back to "String".
      if (!dtype) {
        let lastAttr = document.querySelector('.attributes > .attributes-group .attribute:last-child .attribute-dtype')?.value;
        dtype = lastAttr ? lastAttr : "String";
        htmlItems.dtype = {
          type: "hidden",
          value: dtype
        };
      }
    }

    // Build the form elements used to create the new grouped attribute.
    newKey.innerHTML = EntitySheetHelper.getAttributeHtml(htmlItems, nk, group);

    // Append the form element and submit the form.
    newKey = newKey.children[0];
    form.appendChild(newKey);
    await app._onSubmit(event);
  }

  /**
   * Delete an attribute.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttribute(event, app) {
    const a = event.currentTarget;
    const li = a.closest("li"); //changed ".attribute" to "li" for compatibility with aranthoz2 sheet
    if ( li ) {
      li.parentElement.removeChild(li);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Create new attribute groups.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttributeGroup(event, app) {
    const a = event.currentTarget;
    const form = app.form;
    let newValue = $(a).siblings('.group-prefix').val();
    // Verify the new group key is valid, and use it to create the group.
    if ( newValue.length > 0 && EntitySheetHelper.validateGroup(newValue, app.object) ) {
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="system.groups.${newValue}.key" value="${newValue}"/>`;
      // Append the form element and submit the form.
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete an attribute group.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttributeGroup(event, app) {
    const a = event.currentTarget;
    let groupHeader = a.closest(".group-header");
    let groupContainer = groupHeader.closest(".group");
    let group = $(groupHeader).find('.group-key');
    // Create a dialog to confirm group deletion.
    new Dialog({
      title: game.i18n.localize("SIMPLE.DeleteGroup"),
      content: `${game.i18n.localize("SIMPLE.DeleteGroupContent")} <strong>${group.val()}</strong>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-trash"></i>',
          label: game.i18n.localize("Yes"),
          callback: async () => {
            groupContainer.parentElement.removeChild(groupContainer);
            await app._onSubmit(event);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No"),
        }
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Update attributes when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateAttributes(formData, document) {
    let groupKeys = [];

    // Handle the free-form attributes list
    const formAttrs = foundry.utils.expandObject(formData)?.system?.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let attrs = [];
      let group = null;
      // Handle attribute keys for grouped attributes.
      if ( !v["key"] ) {
        attrs = Object.keys(v);
        attrs.forEach(attrKey => {
          group = v[attrKey]['group'];
          groupKeys.push(group);
          let attr = v[attrKey];
          let k = v[attrKey]["key"] ? v[attrKey]["key"].trim() : attrKey.trim();
          if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
          delete attr["key"];
          // Add the new attribute if it's grouped, but we need to build the nested structure first.
          if ( !obj[group] ) {
            obj[group] = {};
          }
          obj[group][k] = attr;
        });
      }
      // Handle attribute keys for ungrouped attributes.
      else {
        let k = v["key"].trim();
        if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
        delete v["key"];
        // Add the new attribute only if it's ungrouped.
        if ( !group ) {
          obj[k] = v;
        }
      }
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for ( let k of Object.keys(document.system.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Remove grouped attributes which are no longer used.
    for ( let group of groupKeys) {
      if ( document.system.attributes[group] ) {
        for ( let k of Object.keys(document.system.attributes[group]) ) {
          if ( !attributes[group].hasOwnProperty(k) ) attributes[group][`-=${k}`] = null;
        }
      }
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("system.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "system.attributes": attributes});

    return formData;
  }

  /* -------------------------------------------- */

  /**
   * Update attribute groups when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateGroups(formData, document) {
    const formGroups = foundry.utils.expandObject(formData).system.groups || {};
    const documentGroups = Object.keys(document.system.groups || {});

    // Identify valid groups submitted on the form
    const groups = Object.entries(formGroups).reduce((obj, [k, v]) => {
      const validGroup = documentGroups.includes(k) || this.validateGroup(k, document);
      if ( validGroup )  obj[k] = v;
      return obj;
    }, {});

    // Remove groups which are no longer used
    for ( let k of Object.keys(document.system.groups)) {
      if ( !groups.hasOwnProperty(k) ) groups[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("system.groups")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: document.id, "system.groups": groups});
    return formData;
  }

  /* -------------------------------------------- */

  /**
   * @see ClientDocumentMixin.createDialog
   */
  static async createDialog(data={}, options={}) {

    // Collect data
    const documentName = this.metadata.name;
    const folders = game.folders.filter(f => (f.type === documentName) && f.displayed);
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", {type: label});

    // Identify the template Actor types
    const collection = game.collections.get(this.documentName);
    const templates = collection.filter(a => a.getFlag("aranthoz", "isTemplate"));
    // const defaultType = this.TYPES[1];
    const types = {
      // [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
    }
    for ( let t of this.TYPES ) {
      types[t] = t.charAt(0).toUpperCase() + t.slice(1); // t.charAt(0).toUpperCase() + t.slice(1); -> capitalizes string t
    }

    // Render the document creation form
    const template = "templates/sidebar/document-create.html";
    const html = await renderTemplate(template, {
      name: data.name || game.i18n.format("DOCUMENT.New", {type: label}),
      folder: data.folder,
      folders: folders,
      hasFolders: folders.length > 1,
      type: data.type || templates[0]?.id || "",
      types: types,
      hasTypes: true
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title: title,
      content: html,
      label: title,
      callback: html => {

        // Get the form data
        const form = html[0].querySelector("form");
        const fd = new FormDataExtended(form);
        let createData = fd.toObject();

        // Merge with template data
        const template = collection.get(form.type.value);
        console.log(collection)
        if ( template ) {
          createData = foundry.utils.mergeObject(template.toObject(), createData);
          createData.type = template.type;
          delete createData.flags.aranthoz.isTemplate;
        }

        // Merge provided override data
        createData = foundry.utils.mergeObject(createData, data);
        return this.create(createData, {renderSheet: true});
      },
      rejectClose: false,
      options: options
    });
  }

  /* -------------------------------------------- */

  /**
   * Ensure the resource values are within the specified min and max.
   * @param {object} attrs  The Document's attributes.
   */
  static clampResourceValues(attrs) {
    const flat = foundry.utils.flattenObject(attrs);
    for ( const [attr, value] of Object.entries(flat) ) {
      const parts = attr.split(".");
      if ( parts.pop() !== "value" ) continue;
      const current = foundry.utils.getProperty(attrs, parts.join("."));
      if ( current?.dtype !== "Resource" ) continue;
      foundry.utils.setProperty(attrs, attr, Math.clamped(value, current.min || 0, current.max || 0));
    }
  }
}
