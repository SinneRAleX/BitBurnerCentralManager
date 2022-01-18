/** @param {NS} ns **/
import { BASE_DIR, BOOT_SCRIPTS, DEBUG, HACKING_SERVER, MANAGER_SCRIPTS, MANAGING_SERVER, THREAD_SERVER } from "/Orchestrator/Config/Config";
import { Action, ChannelName } from "/Orchestrator/MessageManager/enum";
import { MessageHandler, Payload } from "/Orchestrator/MessageManager/class";
export async function main(ns) {
    const option = ns.args[0];
    let scriptList = BOOT_SCRIPTS;
    const messageHandler = new MessageHandler(ns, ChannelName.bootScript);
    if (option === "no-server-manager")
        scriptList = scriptList.filter(s => s !== ChannelName.serverManager);
    if (MANAGING_SERVER !== "home") {
        await ns.scp(ns.ls("home", BASE_DIR), "home", MANAGING_SERVER);
        ns.tprint("Copying " + ns.ls("home", BASE_DIR).length + " files to " + MANAGING_SERVER);
    }
    if (HACKING_SERVER !== "home") {
        await ns.scp(ns.ls("home", BASE_DIR), "home", HACKING_SERVER);
        ns.tprint("Copying " + ns.ls("home", BASE_DIR).length + " files to " + HACKING_SERVER);
    }
    if (THREAD_SERVER !== "home") {
        await ns.scp(ns.ls("home", BASE_DIR), "home", THREAD_SERVER);
        ns.tprint("Copying " + ns.ls("home", BASE_DIR).length + " files to " + THREAD_SERVER);
    }
    for (const script of scriptList) {
        DEBUG && ns.tprint("Starting " + script);
        ns.exec(MANAGER_SCRIPTS[script].script, MANAGER_SCRIPTS[script].server);
        await ns.sleep(100);
    }
    for (const server of ns.getPurchasedServers()) {
        await messageHandler.sendMessage(ChannelName.threadManager, new Payload(Action.updateHost, server));
    }
}
