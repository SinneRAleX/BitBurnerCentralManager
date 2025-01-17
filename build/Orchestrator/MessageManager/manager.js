/** @param {NS} ns **/
import { Message, Payload, NULL_PORT_DATA } from "/Orchestrator/MessageManager/class";
import { Action, Channel, ChannelName } from "/Orchestrator/MessageManager/enum";
export async function main(ns) {
    ns.disableLog('sleep');
    emptyPorts();
    let messageQueue = [];
    while (true) {
        receiveMessage();
        await checkMessageRequest();
        await checkConsoleCall();
        await checkClearMessage();
        await ns.sleep(10);
    }
    async function checkConsoleCall() {
        const dumpQueue = extractMessage(m => m.payload.action === Action.dumpQueue);
        if (dumpQueue.length > 0) {
            ns.tprint(messageQueue);
        }
    }
    async function checkClearMessage() {
        const messages = extractMessage(m => m.payload.action === Action.clearMyMessage);
        for (const message of messages) {
            messageQueue = messageQueue.filter(m => m.destinationId !== message.originId && m.destination !== message.origin);
        }
    }
    function extractMessage(filter) {
        const extractedMessage = messageQueue.filter(filter);
        messageQueue = messageQueue.filter(m => !filter(m));
        return extractedMessage;
    }
    async function checkMessageRequest() {
        const requests = extractMessage(m => m.payload.action === Action.messageRequest);
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const originId = request.originId;
            const requesterFilter = (m) => (m.destination === request.origin && m.destinationId === request.originId);
            let extraFilter = (m) => true;
            if (request.payload.info) {
                extraFilter = eval(request.payload.info);
            }
            const messageForRequester = extractMessage(requesterFilter);
            const messageToSend = messageForRequester.filter(extraFilter);
            const messageToKeep = messageForRequester.filter(m => !extraFilter(m));
            messageQueue.push(...messageToKeep);
            if (messageToSend.length > 0) {
                await sendMessage(messageToSend);
            }
            await sendMessage([new Message(ChannelName.messageManager, request.origin, new Payload(Action.noMessage), null, request.originId)]);
        }
    }
    async function sendMessage(messageToSend) {
        for (let i = 0; i < messageToSend.length; i++) {
            const writtenMessage = await ns.tryWritePort(Channel[messageToSend[i].destination], messageToSend[i].string);
            if (!writtenMessage) {
                ns.tprint("COULD NOT SEND MESSAGE:");
                ns.tprint(messageToSend[i]);
                messageQueue.push(messageToSend[i]);
            }
        }
    }
    function receiveMessage() {
        const response = ns.readPort(Channel.messageManager);
        if (response !== NULL_PORT_DATA) {
            let parsedResponse = Message.fromJSON(response);
            messageQueue.push(parsedResponse);
        }
    }
    function emptyPorts() {
        for (let i = 1; i < 21; i++) {
            while (true) {
                if (ns.readPort(i) === NULL_PORT_DATA) {
                    break;
                }
            }
        }
    }
}
