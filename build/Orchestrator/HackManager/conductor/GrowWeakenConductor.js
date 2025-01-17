import { MessageHandler, Payload } from "/Orchestrator/MessageManager/class";
import { Action, ChannelName } from "/Orchestrator/MessageManager/enum";
import { DEBUG, HACKING_SCRIPTS } from "/Orchestrator/Config/Config";
import { Hack } from "/Orchestrator/HackManager/hack";
import { executeScript, freeThreads, getThreads } from "/Orchestrator/Common/GenericFunctions";
export async function main(ns) {
    ns.disableLog('sleep');
    ns.disableLog('exec');
    const myId = ns.args[1];
    const mySelf = ChannelName.hackConductor;
    const messageHandler = new MessageHandler(ns, mySelf, myId);
    const hack = Hack.fromJSON(ns.args[0]);
    DEBUG && ns.print("Starting hack: " + myId);
    const growAllocatedThreads = await getThreads(ns, hack.growThreads, messageHandler, hack);
    const weakenAllocatedThreads = await getThreads(ns, hack.weakenThreads, messageHandler, hack);
    let numOfGrowHost = Object.keys(growAllocatedThreads).length;
    let numOfWeakenHost = Object.keys(weakenAllocatedThreads).length;
    let growResponseReceived = 0;
    let weakenResponseReceived = 0;
    if (!numOfGrowHost && !numOfWeakenHost) {
        DEBUG && ns.print("Hack lack required threads");
        weakenAllocatedThreads && await freeThreads(ns, weakenAllocatedThreads, messageHandler);
        growAllocatedThreads && await freeThreads(ns, growAllocatedThreads, messageHandler);
        return messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.hackReady, -1));
    }
    DEBUG && ns.print('Hack ready');
    await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.hackReady));
    DEBUG && ns.print("Starting weaken script");
    DEBUG && ns.print("Starting grow script");
    numOfWeakenHost = await executeScript(ns, HACKING_SCRIPTS.weaken, weakenAllocatedThreads, hack, messageHandler, myId);
    numOfGrowHost = await executeScript(ns, HACKING_SCRIPTS.grow, growAllocatedThreads, hack, messageHandler, myId);
    DEBUG && ns.print("Awaiting grow/weaken confirmation");
    while (true) {
        //const filter = m => (m.payload.action === Action.weakenScriptDone || m.payload.action === Action.growScriptDone)
        //if(await checkForKill()) return
        const response = await messageHandler.getMessagesInQueue();
        for (let k = 0; k < response.length; k++) {
            switch (response[k].payload.action) {
                case Action.growScriptDone:
                    growResponseReceived++;
                    DEBUG && ns.print("Received " + growResponseReceived + "/" + numOfGrowHost + " grow results");
                    break;
                case Action.weakenScriptDone:
                    weakenResponseReceived++;
                    DEBUG && ns.print("Received " + weakenResponseReceived + "/" + numOfWeakenHost + " weaken results");
                    break;
            }
        }
        if (weakenResponseReceived >= numOfWeakenHost && growResponseReceived >= numOfGrowHost) {
            DEBUG && ns.print("Weaken and grow completed.");
            await freeThreads(ns, growAllocatedThreads, messageHandler);
            await freeThreads(ns, weakenAllocatedThreads, messageHandler);
            break;
        }
        await ns.sleep(100);
    }
    const results = "Money status: " + Math.round(ns.getServerMoneyAvailable(hack.host) / ns.getServerMaxMoney(hack.host) * 100000) / 1000 + "%, Security status: " + Math.round(((ns.getServerSecurityLevel(hack.host) / ns.getServerMinSecurityLevel(hack.host)) - 1) * 100000) / 1000;
    await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.hackDone, results));
    await messageHandler.clearMyMessage();
    DEBUG && ns.print("Exiting");
}
