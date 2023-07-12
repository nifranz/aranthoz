export class ActionSequences extends FormApplication {
    constructor(item) {
        super(item);
        this.item = item; 
    }
    renderTitle() {
        return '<div>My Title</div>'
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/aranthoz/templates/aranthoz/item-sheet/actions/action-sequences.html",
            resizable: true,
        })
    }
}

export class ActionRolls extends FormApplication {
    constructor(item) {
        super(item);
        this.item = item; 
    }

    renderTitle() {
        return '<div>My Title</div>'
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/aranthoz/templates/aranthoz/item-sheet/actions/action-rolls.html",
            resizable: true,
        })
    }
}