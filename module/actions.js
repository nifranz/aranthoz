export async function startWorkflow(value) {
    let targets = game.user.targets.toObject();
    let tokenIds = [];

    for (let t of targets) {
        tokenIds.push(t.document._id);
    }

    console.log(tokenIds);
    updateTokens(tokenIds, value);
}

export async function updateTokens(tokenIds, value) {
    createGMMessage(tokenIds, value);
}

async function createGMMessage(tokenIds, value) {
    ChatMessage.create({
        content: `<button gmbutton data-tokenids="${tokenIds}" data-value="${value}">Button</button>`,
        whisper: ChatMessage.getWhisperRecipients("GM")
    });
}

export async function executeTokenAction(tokenId, value) {
    console.log(tokenId, value)
    console.log("executing token action")
    let token = await game.canvas.tokens.get(tokenId).document;
    value = parseInt(value);
    
    if (token.actorLink) { // if token is linked to an actor update its actor
        let actorId = token.actorId;
        let actor = await Actor.get(actorId);

        let newValue = parseInt(actor.system.health.value) + value;

        actor.update({
            "system.health.value": newValue
        });
    } else { // if token is not linked to an actor update the token itself
        let newValue = parseInt(token.actorData.system.health.value) + value;
        token.update({
            "actorData.system.health.value": newValue 
        })
    }
}