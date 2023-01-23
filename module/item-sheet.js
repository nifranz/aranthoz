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
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    const itemId = context.data._id;
    const itemOwner = Actor.get(EntitySheetHelper.getItemOwnerId(itemId));
    const itemOwnerId = itemOwner._id;
    console.log("itemOwnerId: " + itemOwnerId);
    const item = itemOwner.items.get(itemId);
    context.ownerId = itemOwnerId;
    context.isOfTypeItem = context.data.type === "item";    

    if (itemOwnerId) {
      // add an ownerAttributes property to the context object that holds an object {"value": skill, "selected": "selected" or ""} for all available attributes of the owner
      var ownerAttributes = [];
      var hasSkill = false
      for (var a of EntitySheetHelper.getActorAttributes(itemOwnerId)) {
        var selected = "";
        if (a == context.systemData.skill) {
          selected = " selected";
          hasSkill = true;
        }
        ownerAttributes.push({"value": a, "selected": selected});
        console.log(ownerAttributes);
      }
      context.ownerAttributes = ownerAttributes;

      // check if item.skill has been set for an item that has been deleted. if so, remove the link.
      if (!hasSkill) {
        item.skill = "";
      }
    } 
   
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


