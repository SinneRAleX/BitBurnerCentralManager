import { MessageHandler, Payload } from '/Orchestrator/Class/Message';
import { Action, ChannelName } from "/Orchestrator/Enum/MessageEnum";
import { DEBUG, HACKING_SCRIPTS } from "/Orchestrator/Config/Config";
import { HackType } from "/Orchestrator/Enum/HackEnum";
import { Hack } from "/Orchestrator/Class/Hack";
export async function main(ns) {
    ns.disableLog('sleep');
    ns.disableLog('exec');
    const myId = ns.args[1];
    const mySelf = ChannelName.hackConductor;
    const messageHandler = new MessageHandler(ns, mySelf, myId);
    const hack = Hack.fromJSON(ns.args[0]);
    DEBUG && ns.print("Starting hack: " + myId);
    const weakenAllocatedThreads = await getThreads(hack.weakenThreads);
    const numOfWeakenHost = Object.keys(weakenAllocatedThreads).length;
    let weakenResponseReceived = 0;
    let cycle = 0;
    DEBUG && ns.print('Hack ready');
    await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.hackReady));
    DEBUG && ns.print("Starting weaken script. Cycle number: " + cycle);
    executeScript(HACKING_SCRIPTS.weaken, weakenAllocatedThreads);
    DEBUG && ns.print("Awaiting weaken confirmation");
    while (true) {
        while (true) {
            const messageFilter = (m) => m.payload.action === Action.weakenScriptDone;
            const response = await messageHandler.waitForAnswer(messageFilter);
            if (response[0].payload.action === Action.weakenScriptDone) {
                weakenResponseReceived++;
                DEBUG && ns.print("Received " + weakenResponseReceived + "/" + numOfWeakenHost + " weaken results");
            }
            if (weakenResponseReceived >= numOfWeakenHost) {
                DEBUG && ns.print("Weaken cycle completed.");
                cycle++;
                break;
            }
        }
        const stopMessage = messageHandler.popLastMessage();
        if (stopMessage[0]?.payload.action === Action.stop) {
            break;
        }
    }
    await freeThreads(weakenAllocatedThreads);
    await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.hackDone, "Stop request"));
    DEBUG && ns.print("Exiting");
    async function getThreads(amount) {
        DEBUG && ns.print("Getting threads");
        await messageHandler.sendMessage(ChannelName.threadManager, new Payload(Action.getThreads, amount, hack.hackType === HackType.quickMoneyHack));
        const response = messageHandler.waitForAnswer();
        return response[0].payload.info;
    }
    function executeScript(script, threads) {
        DEBUG && ns.print("Executing scripts");
        for (let i = 0; i < Object.keys(threads).length; i++) {
            const keyName = Object.keys(threads)[i];
            ns.exec(script, keyName, threads[keyName], hack.host, myId);
        }
    }
    async function freeThreads(allocatedThreads) {
        DEBUG && ns.print("Freeing threads");
        await messageHandler.sendMessage(ChannelName.threadManager, new Payload(Action.freeThreads, allocatedThreads));
    }
}
