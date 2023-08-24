/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";
import { SimpleItemSheet } from "./simple/simple-item-sheet.js";
import { SimpleActorSheet } from "./simple/simple-actor-sheet.js";
import { AranthozItemSheet } from "./item-sheet.js";
import { AranthozActorSheet } from "./actor-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createWorldbuildingMacro } from "./macro.js";
import { createAranthozMacro } from "./macro.js";
import { SimpleToken, SimpleTokenDocument } from "./token.js";
import { Rolls as rolls } from "./roll.js";
import { updateTokens, executeTokenAction, startWorkflow } from "./actions.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Simple Worldbuilding System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };
  let formAppInstances = {}
  game.aranthoz = {
    SimpleActor,
    createWorldbuildingMacro,
    createAranthozMacro,
    rolls,
    updateTokens,
    startWorkflow,
    formAppInstances
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;
  CONFIG.Token.documentClass = SimpleTokenDocument;
  CONFIG.Token.objectClass = SimpleToken;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("aranthoz", AranthozActorSheet), { makeDefault: true };
  Actors.registerSheet("aranthoz", SimpleActorSheet );
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("aranthoz", AranthozItemSheet, { makeDefault: true });
  Items.registerSheet("aranthoz", SimpleItemSheet);

  // Register system settings
  game.settings.register("aranthoz", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting.
  game.settings.register("aranthoz", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("aranthoz", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));
Hooks.on("hotbarDrop", (bar, data, slot) => createAranthozMacro(data, slot));

/**
 * Adds the actor template context menu.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {

  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return !actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("aranthoz", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("aranthoz", "isTemplate", false);
    }
  });
});

/**
 * Enables Chat Message function calls in buttons
 */

Hooks.on("renderChatMessage", (message, html) => {
  html.find('button[data-tokenids]').click(event => {
    let tokenIds = event.currentTarget.dataset.tokenids;
    const value = event.currentTarget.dataset.value;

    console.log(tokenIds);
    tokenIds = tokenIds.split(",");
    console.log(value);
  
    if (value) {
      for (let tokenId of tokenIds) { // for every tokenId in tokenIds execute a tokenAction Call
        executeTokenAction(tokenId, value);
      }
    }
  });
});


/**
 * Adds the item template context menu.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {

  // Define an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li.data("documentId"));
      return !item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data("documentId"));
      item.setFlag("aranthoz", "isTemplate", true);
    }
  });

  // Undefine an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li.data("documentId"));
      return item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data("documentId"));
      item.setFlag("aranthoz", "isTemplate", false);
    }
  });
});



// Hooks.on("renderAranthozItemSheet", (sheet, html, data) => {
//   html.find('._item-sheet').off('drop');
//   console.log("own hook")
//   html.find('._item-sheet').on('dragenter', (event) => {
//     console.log(event)
//     event.preventDefault();
//     event.stopPropagation();
//     html.addClass('dragover');
//   });

//   html.find('._item-sheet').on('dragleave', (event) => {
//     event.preventDefault();
//     event.stopPropagation();
//     html.removeClass('dragover');
//   });

//   html.find('._item-sheet').on('dragover', (event) => {
//     event.preventDefault();
//     event.stopPropagation();
//   });
  
//   html.find('._item-sheet').on('drop', handleDrop)
//   async function handleDrop(event) {
//     event.preventDefault();
//     event.stopPropagation();
//     html.removeClass('dragover');

//     console.log(event)
//     const journalEntryId = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain')).uuid.split('.')[1];
//     const journalEntry = await game.journal.get(journalEntryId);
//     console.log(journalEntryId)
//     const targetItem = sheet.object;

//     targetItem.update({"system.journalEntry": journalEntry._id});
//     targetItem.update({"system.journalEntryName": journalEntry.name})
//     // Perform actions based on the dropped journal entry and target item
//   } 

// });

function handleJournalEntryDrop(journalEntry, targetItem) {
  targetItem.update({"system.journalEntry": journalEntry._id});
  targetItem.update({"system.journalEntryName": journalEntry.name})
  // Perform actions based on the dropped journal entry and target item
  // Add your logic here based on the dropped journal entry and target item
}

// JournalEntry Item Selector Dialog implementation
// Add a new button to the item sheet
Hooks.on("renderItemSheet", function (sheet, html, data) {
  const openJournalButton = html.find("._journal-selector-button")
  // Handle button click event
  openJournalButton.click((event) => {
    event.preventDefault();
    openJournalDialog();
  });

});

// Open the journal dialog
async function openJournalDialog() {
  console.log("opening...")
  const dialogTemplate = 'systems/aranthoz/templates/aranthoz/item-sheet/journal-selector.html';
  const dialogOptions = {
    width: 400,
    height: 300,
    resizable: false,
  };

  const ownedEntries = game.journal.directory.documents;
  console.log(ownedEntries)
  let folderIds = [];
  for (let e of ownedEntries) {
    if (e.folder) {
      const folderId = e.folder._id;
      if (!folderIds.includes(folderId)) {
        folderIds.push(folderId)
      }
    } 
  }
  let folders = {}
  folders["folderless"] = {
    "name": "No folder",
    "entries": []
  }
  for (let id of folderIds) {
    const folder = await game.folders.get(id)
    folders[id] = {
      "name": folder.name,
      "entries": game.journal.filter(je => {
        console.log(je)
        if (je.folder) return je.folder._id === id
        else {
          if (!folders["folderless"]["entries"].includes(je)) {
            folders["folderless"]["entries"].push(je);
          }
        }
      }) 
    }
  }
  console.log(folders)

  const data = {folders}
  const rendered_html = await renderTemplate(dialogTemplate, data)

  // Load the dialog template and render the dialog
  new Dialog({
    title: dialogOptions.title,
    content: rendered_html,
    buttons: {},
    default: 'close',
  }).render(true);

}

Hooks.on("dropData", (canvas, data) => {
  // Check if the dropped data is a JournalEntry
    ui.notifications.info("dropped")
  if (data.type === "JournalEntry") {
    const droppedJournalEntryId = data.id;
    const targetItem = canvas.tokens.controlled[0]?.actor?.items?.get(data.pack);
    
    // Check if the target item is an ItemSheet
    if (targetItem?.sheet?.rendered) {
      const itemSheet = targetItem.sheet;

      console.log("dropped something!")
      ui.notifications.info("dropped something")
      // Handle the drop action on the item sheet
      // handleJournalEntryDrop(itemSheet, droppedJournalEntryId);
    }
  }
});
