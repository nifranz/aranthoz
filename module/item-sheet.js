import { EntitySheetHelper } from "./helper.js";
import { SimpleEntitySheetHelper } from "./simple/simple-helper.js";
import { ATTRIBUTE_TYPES } from "./constants.js";

export class AranthozItemSheet extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["aranthoz", "sheet", "item"],
      template: "systems/aranthoz/templates/aranthoz/item-sheet/item-sheet.html",
      width: 570,
      height: 480,
      tabs: [{navSelector: "._item-nav", contentSelector: "._sheet-body", initial: "general"}],
      // scrollY: [".attributes"]
      // scrollY: ["._sheet-body"],
      dragDrop: [{dragSelector: null},{dropSelector: ["._item-sheet"]}]
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
    console.log("this", this)
    
    const context = await super.getData(options);
    console.log("Context");
    console.log(context)
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    console.log(context.systemData)
    const item = context.item;
    EntitySheetHelper.getItemTypeBooleans(context.data);
    console.log(context.data.isOfType)
    // for (const type of Item.TYPES) {
    //   // add "isType" property to the item for handlebars
    //   const typeUpper = type.charAt(0).toUpperCase() + type.slice(1);
    //   context[`isOfType${typeUpper}`] = context.data.type === type;
    // }

    // context.isOfTypeItem = context.data.type === "item";
    // context.isOfTypeWeapon = context.data.type === "weapon";
    // context.isOfTypeAction = context.data.type === "action";

    if (item.actor) {
      // add item specific information to hbs context
      context.ownerId = item.actor._id; 

      context.ownerRessource = item.actor.system.identityAttributes.ressource;
      context.ownerRessource = context.ownerRessource.charAt(0).toUpperCase() + context.ownerRessource.slice(1);

      // add an ownerAttributes property to the context object that holds an object {"value": skill, "selected": "selected" or ""} for all available attributes of the owner

      var ownerAttributeCollection = item.actor.system.attributes
      var ownerAttributeList = []
  
      // Loop through all attribute groups
      var attributeGroups = Object.entries(ownerAttributeCollection);    
      for (var group of attributeGroups) {
        var groupKey = group[0];
        var groupAttributeCollection = group[1];
        var attributes = Object.keys(groupAttributeCollection);
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
        item.update({"system.skill": ""});
      }
      context.ownerAttributes = ownerAttributeList;
    } else {
      context.ownerRessource = "<Actor Ressource>"
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

    // reset the link when no journalEntry can be found under the stored id (which would be the case if the journalEntry itself has been deleted)
    const journalEntry = await JournalEntry.get(context.data.system.journalEntry);
    if (!journalEntry) {
      item.update({"system.journalEntry": ""});
    }
    
    let rarityBoolean = {};
    for (let rarity of ["legendary", "rare", "epic", "common"]) {
      let rarityCapitalized = rarity.charAt(0).toUpperCase() + rarity.slice(1)
      rarityBoolean["is" + rarityCapitalized] = context.systemData.rarity === rarity;
    }
    console.log("raritybool", rarityBoolean)
    context.rarityBoolean = rarityBoolean;


    console.log("Item Context")
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
    html.find("._attribute-control").on("click", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find("._group-control").click(EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));
    html.find(".skill").on("change", ".skill-select", EntitySheetHelper.onSkillChange.bind(this));
    html.find("._quantity-control").on("click", EntitySheetHelper.onItemQuantityControl.bind(this));

    html.find("._open-journal-button").on("click", EntitySheetHelper.openItemJournal.bind(this));
    html.find("._unlink-journal-button").on("click", EntitySheetHelper.unlinkItemJournal.bind(this));

    html.find("._edit-action-button").on("click", EntitySheetHelper.openActionEditorSheet.bind(this));
    html.find("._show-actions-info-sheet").on("click", EntitySheetHelper.showActionsInfoSheet.bind(this));

    html.find("._action-control").on("click", EntitySheetHelper.onClickActionControl.bind(this));
    
    // Add draggable for Macro creation
    html.find("_item-sheet").each((i, a) => {
      console.log(a)
      a.addEventListener("drop", ev => {
        console.log("yo")
      }, false);
    });

    html.find("._action-roll-button").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", e => {
        let dragData = e.currentTarget.dataset;
        console.log(dragData)
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
      }, false)
    })

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      console.log(a)
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }
  async _onDragOver (event) {
    console.log("dragover");
    const dropbg = event.target.closest('.dragbg');
    console.log(dropbg)
    if (!dropbg) return;
    dropbg.classlist.add('drag-over')
  }

  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    }
    catch (err) {
      return false;
    }
    console.log(data)

    const journalEntryId = JSON.parse(event.dataTransfer.getData('text/plain')).uuid.split('.')[1];
    const journalEntry = await game.journal.get(journalEntryId);
    console.log(journalEntryId)
    const targetItem = this.object;

    targetItem.update({"system.journalEntry": journalEntry._id});
    targetItem.update({"system.journalEntryName": journalEntry.name})
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData) {
    console.log("hi");
    console.log(updateData)
    let formData = super._getSubmitData(updateData);
    console.log(formData)
    console.log(this.object)
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }

}
