import { EntitySheetHelper } from "./helper.js";
import { SimpleEntitySheetHelper } from "./simple/simple-helper.js";
import { ATTRIBUTE_TYPES } from "./constants.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AranthozActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["aranthoz", "sheet", "actor"],
      template: "systems/aranthoz/templates/aranthoz/actor-sheet/actor-sheet.html",
      width: 1000,
      height: 600,
      tabs: [
        {navSelector: ".body-nav", contentSelector: ".sheet-body", initial: "character"},
        {navSelector: ".misc-nav", contentSelector: ".misc-content", initial: "documents"},
      ],
      // scrollY: [".character", ".attributes", ".weapons", ".actions", ".inventory"],
      dragDrop: [{dragSelector: ".item-list .dragItem", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("aranthoz", "macroShorthand");
    context.systemData = context.data.system;

    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });

    // add sheet-specific booleans to hbs-context
    // add actor-sheet boolean
    context.isActor = true;
    for (var i of context.data.items) {
      // add if an item is of type "item" (-> not "weapon" or "skill")
      i.isOfTypeItem = i.type === "item";
    }

    // add character-specific information to hbs-context
    // add actionType booleans
    context.isMage = context.data.system.identityAttributes.ressource === "mana";
    context.isFighter = context.data.system.identityAttributes.ressource === "stamina";

    // add origin booleans
    var origin = {};
    origin.isMyhriad = context.data.system.identityAttributes.origin === "myhriad";
    origin.isSalir = context.data.system.identityAttributes.origin === "salir";
    origin.isDunvia = context.data.system.identityAttributes.origin === "dunvia";
    origin.isDunrodia = context.data.system.identityAttributes.origin === "dunrodia";
    origin.isThyrgrad = context.data.system.identityAttributes.origin === "thyrgrad";
    origin.isVenicria = context.data.system.identityAttributes.origin === "venicria";
    origin.isLorthing = context.data.system.identityAttributes.origin === "lorthing";
    origin.isRhykva = context.data.system.identityAttributes.origin === "rhykva";
    context.origin = origin;

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Control Button Listeners
    html.find("._attribute-control").on("click", EntitySheetHelper.onClickAttributeControl.bind(this));
    if (0) html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    
    // Item Control Button Listeners
    html.find("._item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));
    html.find("._quantity-control").on("click", EntitySheetHelper.onItemQuantityControl.bind(this));
    
    // Roll Button Listener 
    html.find("._roll-button").on('click', EntitySheetHelper.onActorSheetRoll.bind(this));

    // Roll Button Drag&Drop Listeners
    html.find("._roll-button").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", e => {
        let dragData = e.currentTarget.dataset;
        console.log(dragData)
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
      }, false)
    })
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  async _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create": 
      {
        const cls = getDocumentClass("Item");
        const itemType = button.getAttribute("item-type");
        if (itemType) {
          var name = "New " + itemType[0].toUpperCase() + itemType.substring(1); 
          if (itemType === 'misc') name += " Item"
        }
        const item = await cls.create({name: name || game.i18n.localize("SIMPLE.ItemNew"), type: button.getAttribute("item-type")}, {parent: this.actor});
        console.log(item);
        return item;
      }

      case "edit":
      {
        const item = this.actor.items.get(li?.dataset.itemId);
        return item.sheet.render(true);
      }

      case "delete":
      {
        const item = this.actor.items.get(li?.dataset.itemId);
        return item.delete();
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {

  console.log("ya");
  console.log(updateData);
    let formData = super._getSubmitData(updateData);
    console.log("formData, this.object");
    console.log(formData);
    console.log(this.object)
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}