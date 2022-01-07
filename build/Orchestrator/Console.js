import { Action, ChannelName } from "/Orchestrator/Enum/MessageEnum";
import { MessageHandler, Payload } from "/Orchestrator/Class/Message";
export async function main(ns) {
    const allowedAction = {
        kill: {
            function: kill,
            help: "Kill the orchestra"
        },
        pause: {
            function: pause,
            help: "This will pause the HackManager, it will let the conductor finish first."
        },
        resume: {
            function: resume,
            help: "Resume the hack manager after a pause."
        },
        help: {
            function: help,
            help: "Print this."
        }
    };
    let action = ns.args[0];
    if (!action) {
        action = "help";
    }
    if (!Object.keys(allowedAction).includes(action)) {
        ns.tprint("Invalid operation");
    }
    const mySelf = ChannelName.consoleLink;
    const messageHandler = new MessageHandler(ns, mySelf);
    await allowedAction[action].function();
    async function kill() {
        ns.tprint("Killing the orchestra.");
        await messageHandler.sendMessage(ChannelName.threadManager, new Payload(Action.kill));
    }
    async function pause() {
        ns.tprint("Pausing the hack manager.");
        await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.pause));
    }
    async function resume() {
        ns.tprint("Resuming the hack manager.");
        await messageHandler.sendMessage(ChannelName.hackManager, new Payload(Action.resume));
    }
    async function help() {
        ns.tprint("Usage: run Console.ts [action]: ");
        for (let i = 0; i < Object.keys(allowedAction).length; i++) {
            const keyName = Object.keys(allowedAction)[i];
            ns.tprint(" - " + keyName + ": " + allowedAction[keyName].help);
        }
    }
}
