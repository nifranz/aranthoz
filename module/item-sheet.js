import { EntitySheetHelper } from "./helper.js";
import { ATTRIBUTE_TYPES } from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class AranthozItemSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "item"],
      template: "systems/aranthoz/templates/aranthoz/item-sheet.html",
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /**
   * Prepares data used by handlebar templating in variable "context".
   * Also checks, if item.skill property has been set for an item that has been deleted. If so, removes the link by setting item.skill = ""
   * 
   * @inheritdoc 
   */

  async getData(options) {
    const context = await super.getData(options);
    console.log("Context");
    console.log(context)
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    const item = context.item;

    if (item.actor) {
      // add item specific information to hbs context
      context.ownerId = item.actor._id;
      context.isOfTypeItem = context.data.type === "item";

      // add an ownerAttributes property to the context object that holds an object {"value": skill, "selected": "selected" or ""} for all available attributes of the owner

      var ownerAttributeCollection = item.actor.system.attributes
      var ownerAttributeList = []
  
      // Loop through all attribute groups
      var attributeGroups = Object.entries(ownerAttributeCollection);    
      for (var group of attributeGroups) {
        var groupKey = group[0];
        var groupAttributeCollection = group[1]
        var attributes = Object.keys(groupAttributeCollection)
        // Loop through the attributes
        for (var attribute of attributes) {
          // Append an attribute to the attribute list
          ownerAttributeList.push({"value": groupKey + "." + attribute, "selected": ""})
        }
      }
      
      var hasSkill = ownerAttributeList.filter(attribute => {
        // check if actor has corresponding skillKey; if so, change selected property accordingly for later use in hbs
        if (attribute.value == context.systemData.skill) {
          attribute.selected = "selected";
          return true;
        } else return false;
        
      });
      if (!hasSkill) {
        // deleting the link if actor has no such skill;
        console.log("hasnoskilllol");
        item.update({"system.skill": ""})
      }
      context.ownerAttributes = ownerAttributeList;
    } 
   
    context.dtypes = ATTRIBUTE_TYPES;
    context.descriptionHTML = await TextEditor.enrichHTML(context.systemData.description, {
      secrets: this.document.isOwner,
      async: true
    });

    var appliesDamage = item.system.attributes.appliesDamage;
    if (appliesDamage) {
      context.appliesDamage = appliesDamage.value;
    }
    
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));
    html.find(".skill").on("change", ".skill-select", EntitySheetHelper.onSkillChange.bind(this))

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}




/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SimpleItemSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "item"],
      template: "systems/aranthoz/templates/simple/item-sheet.html",
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.descriptionHTML = await TextEditor.enrichHTML(context.systemData.description, {
      secrets: this.document.isOwner,
      async: true
    });
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}

/* -------------------------------------------- */
/* -------------------------------------------- */
/* -------------------------------------------- */


