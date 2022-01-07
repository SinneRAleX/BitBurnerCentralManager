/** @param {NS} ns **/
import { Message } from "/Orchestrator/Class/Message";
import { Channel } from "/Orchestrator/Enum/MessageEnum";
export async function main(ns) {
    ns.disableLog('sleep');
    let messageQueue = [];
    while (true) {
        receiveMessage();
        await sendMessage();
        await ns.sleep(10);
    }
    async function sendMessage() {
        const newQueue = [];
        for (let i = 0; i < messageQueue.length; i++) {
            const writtenMessage = await ns.tryWritePort(Channel[messageQueue[i].destination], messageQueue[i].string);
            if (!writtenMessage) {
                newQueue.push(messageQueue[i]);
            }
        }
        messageQueue = newQueue;
    }
    function receiveMessage() {
        const response = ns.readPort(Channel.messageManager);
        if (response != "NULL PORT DATA") {
            let parsedResponse = Message.fromJSON(response);
            messageQueue.push(parsedResponse);
        }
    }
}
