import { Hack, hackSorter } from "/Orchestrator/Class/Hack";
import { HackType } from "/Orchestrator/Enum/HackEnum";
export function XPHackAlgorithm(ns, currentHack, hackedHost) {
    let potentialHack = [];
    for (let host of hackedHost) {
        if (host.maxMoney === 0) {
            continue;
        }
        if (currentHack.find(h => h.host === host.name)) {
            continue;
        }
        potentialHack.push(new Hack(host.name, 1, 100, 0, 0, -1, (3 + (host.minSecurity * 0.3)) / host.weakenTime, HackType.xpHack, 0));
    }
    // Sort potentialHack by value.
    potentialHack.sort(hackSorter);
    // XP hack need only one hack
    potentialHack = potentialHack[0] ? [potentialHack[0]] : [];
    return potentialHack;
}
