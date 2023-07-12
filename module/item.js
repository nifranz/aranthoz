import {EntitySheetHelper} from "./helper.js";

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.system.groups = this.system.groups || {};
    this.system.attributes = this.system.attributes || {};
    EntitySheetHelper.clampResourceValues(this.system.attributes);
    this.system.actions2 = [
      { 
        "key": "actionKey", 
        "elements": [
          {
            "type": "heal",
            "targets": "self",
          }
        ],
        "costs": {
          "onSuccess": "10",
          "onFailure": "20",
        }
      }
    ]
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }

  /* -------------------------------------------- */

  /**
   * Is this Item used as a template for other Items?
   * @type {boolean}
   */
  get isTemplate() {
    return !!this.getFlag("aranthoz", "isTemplate");
  }
}
