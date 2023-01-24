import { EntitySheetHelper } from "./helper.js";
import { ATTRIBUTE_TYPES } from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AranthozActorSheet2 extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["aranthoz", "sheet", "actor"],
      template: "systems/aranthoz/templates/aranthoz2/aranthoz2.html",
      width: 1000,
      height: 600,
      tabs: [{navSelector: ".body-nav", contentSelector: ".sheet-body", initial: "character"}],
      // scrollY: [".character", ".attributes", ".weapons", ".actions", ".inventory"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    console.log("Context:");
    console.log(context);

    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("aranthoz", "macroShorthand");
    context.systemData = context.data.system;
    console.log(context.systemData)
    for (var i of context.data.items) {
      i.isOfTypeItem = i.type === "item";
    }
    console.log(context.data.items)
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });
    context.isActor = true;
    console.log("context:")
    console.log(context)
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Skills Management
    html.find(".skills").on("click", ".skill-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));

    // Sheet Rolls Management
    html.find(".skills").on("click", "a.skill-roll", EntitySheetHelper.onAranthozAttributeRoll.bind(this));
    html.find(".item-list").on("click", "a.weapon-roll", EntitySheetHelper.onAranthozItemRoll.bind(this));
    html.find(".item-list").on("click", "a.action-roll", EntitySheetHelper.onAranthozItemRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".skills a.skill-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        console.log(ev.currentTarget)
        console.log(dragData);
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        console.log(ev.dataTransfer);
      }, false);
    });

    html.find(".weapons a.weapon-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        console.log(ev.currentTarget)
        console.log(dragData);
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        console.log(ev.dataTransfer);
      }, false);
    });
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
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        console.log(button.getAttribute("item-type"))
        var name = (button.getAttribute("item-type"))
        if (name) {
          name = "New " + name[0].toUpperCase() + name.substring(1)
        }
        return cls.create({name: name || game.i18n.localize("SIMPLE.ItemNew"), type: button.getAttribute("item-type")}, {parent: this.actor});
        
        // const types = {
        //   // [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
        // }
        // for ( let t of Item.TYPES ) {
        //   types[t] = t.charAt(0).toUpperCase() + t.slice(1); // t.charAt(0).toUpperCase() + t.slice(1); -> capitalizes string t
        // }    
        // // Render the document creation form
        // const template = "templates/sidebar/document-create.html";
        // const html = await renderTemplate(template, {
        //   name: "New Item", //data.name || game.i18n.format("DOCUMENT.New", {type: label}),
        //   folder: undefined, //data.folder,
        //   folders: undefined, //folders,
        //   hasFolders: false, //folders.length > 1,
        //   type: "Type", //data.type || templates[0]?.id || "",
        //   types: types,
        //   hasTypes: true
        // });
    
        // // Render the confirmation dialog window
        // return Dialog.prompt({
        //   title: "Create Item for " + this.actor.name,
        //   content: html,
        //   label: "Item Name",
        //   callback: html => {
    
        //     // Get the form data
        //     const form = html[0].querySelector("form");
        //     const fd = new FormDataExtended(form);
        //     let createData = fd.toObject();
    
        //     // Merge provided override data
        //     const cls = getDocumentClass("Item");
        //     return cls.create({name: createData.name || "New Item", type: createData.type}, {parent: this.actor});
        //   },
        //   rejectClose: false,
        //   options: undefined
        // });
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
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


/* ////////////////////////////////////* ////////////////////////////////////* ///////////////////////////////////
/* ////////////////////////////////////* ////////////////////////////////////* ///////////////////////////////////
/* ////////////////////////////////////* ////////////////////////////////////* ///////////////////////////////////
/* ////////////////////////////////////* ////////////////////////////////////* ///////////////////////////////////

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class AranthozActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "actor"],
      template: "systems/aranthoz/templates/aranthoz/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("aranthoz", "macroShorthand");
    context.systemData = context.data.system;
    console.log(context.systemData)
    for (var i of context.data.items) {
      i.isOfTypeItem = i.type === "item";
    }
    console.log(context.data.items)
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });
    context.isActor = true;
    console.log(context)
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
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAranthozAttributeRoll.bind(this));
    html.find(".items").on("click", "a.item-roll", EntitySheetHelper.onAranthozItemRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

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
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        
        const types = {
          // [defaultType]: game.i18n.localize("SIMPLE.NoTemplate")
        }
        for ( let t of Item.TYPES ) {
          types[t] = t.charAt(0).toUpperCase() + t.slice(1); // t.charAt(0).toUpperCase() + t.slice(1); -> capitalizes string t
        }
    
        // Render the document creation form
        const template = "templates/sidebar/document-create.html";
        const html = await renderTemplate(template, {
          name: "New Item", //data.name || game.i18n.format("DOCUMENT.New", {type: label}),
          folder: undefined, //data.folder,
          folders: undefined, //folders,
          hasFolders: false, //folders.length > 1,
          type: "Type", //data.type || templates[0]?.id || "",
          types: types,
          hasTypes: true
        });
    
        // Render the confirmation dialog window
        return Dialog.prompt({
          title: "Create Item for " + this.actor.name,
          content: html,
          label: "Item Name",
          callback: html => {
    
            // Get the form data
            const form = html[0].querySelector("form");
            const fd = new FormDataExtended(form);
            let createData = fd.toObject();
    
            // Merge provided override data
            const cls = getDocumentClass("Item");
            return cls.create({name: createData.name || "New Item", type: createData.type}, {parent: this.actor});
          },
          rejectClose: false,
          options: undefined
        });

        return
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
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
    console.log("ye");
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


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "actor"],
      template: "systems/aranthoz/templates/simple/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
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

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        console.log(ev.currentTarget)
        console.log(dragData);
        console.log(JSON.stringify(dragData));
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        console.log(ev.dataTransfer);
      }, false);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");

        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
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
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
