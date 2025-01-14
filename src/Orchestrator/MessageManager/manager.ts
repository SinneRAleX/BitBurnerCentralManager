/** @param {NS} ns **/

import {NS} from "Bitburner";
import {Message, Payload, NULL_PORT_DATA} from "/Orchestrator/MessageManager/class";
import {Action, Channel, ChannelName} from "/Orchestrator/MessageManager/enum";

export async function main(ns: NS) {
    ns.disableLog('sleep')

    emptyPorts()

    let messageQueue: Message[] = [];
    while (true) {
        receiveMessage();
        await checkMessageRequest();
        await checkConsoleCall();
        await checkClearMessage();
        await ns.sleep(10);
    }

    async function checkConsoleCall() {
        const dumpQueue: Message[] = extractMessage(m => m.payload.action === Action.dumpQueue)
        if (dumpQueue.length>0) {
            ns.tprint(messageQueue)
        }
    }

    async function checkClearMessage() {
        const messages: Message[] = extractMessage(m => m.payload.action === Action.clearMyMessage)
        for (const message of messages) {
            messageQueue = messageQueue.filter(m => m.destinationId !== message.originId && m.destination !== message.origin)
        }
    }

    function extractMessage(filter: (m) => boolean): Message[] {
        const extractedMessage: Message[] = messageQueue.filter(filter)
        messageQueue = messageQueue.filter(m=>!filter(m))
        return extractedMessage
    }

    async function checkMessageRequest() {
        const requests: Message[] = extractMessage(m => m.payload.action === Action.messageRequest)
        for (let i=0; i<requests.length; i++) {
            const request: Message = requests[i]
            const originId = request.originId
            const requesterFilter: (m: Message) => boolean = (m) => (m.destination === request.origin && m.destinationId === request.originId)
            let extraFilter: (m: Message) => boolean = (m) => true
            if (request.payload.info) {
                extraFilter = eval(request.payload.info as string)
            }
            const messageForRequester: Message[] = extractMessage(requesterFilter)
            const messageToSend: Message[] = messageForRequester.filter(extraFilter)
            const messageToKeep: Message[] = messageForRequester.filter(m=>!extraFilter(m))
            messageQueue.push(...messageToKeep)
            if (messageToSend.length>0) {
                await sendMessage(messageToSend)
            }
            await sendMessage([new Message(ChannelName.messageManager, request.origin, new Payload(Action.noMessage), null, request.originId)])
        }
    }

    async function sendMessage(messageToSend: Message[]) {
        for (let i = 0; i < messageToSend.length; i++) {
            const writtenMessage = await ns.tryWritePort(
                Channel[messageToSend[i].destination],
                messageToSend[i].string
            );
            if (!writtenMessage) {
                ns.tprint("COULD NOT SEND MESSAGE:")
                ns.tprint(messageToSend[i])
                messageQueue.push(messageToSend[i])
            }
        }
    }

    function receiveMessage() {
        const response: string = ns.readPort(Channel.messageManager);
        if (response !== NULL_PORT_DATA) {
            let parsedResponse: Message = Message.fromJSON(response);
            messageQueue.push(parsedResponse);
        }
    }

    function emptyPorts() {
        for (let i=1; i<21; i++) {
            while (true) {
                if(ns.readPort(i) === NULL_PORT_DATA) {
                    break
                }
            }
        }
    }
}
