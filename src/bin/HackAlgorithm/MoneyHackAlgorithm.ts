import {NS} from "Bitburner";
import {DEBUG} from "../Config";
import {Hack, HackedHost, hackSorter} from "../Class/Hack";
import {HackType} from "../Enum/HackEnum";

export function MoneyHackAlgorithm(ns: NS, currentHack: Hack[], hackedHost: HackedHost[]): Hack[] {
    DEBUG && ns.print("Calculating hacks")
    let potentialHack: Hack[] = []

    for (let i = 0; i < hackedHost.length; i++) {
        if (hackedHost[i].maxMoney === 0) {
            continue
        }

        if (currentHack.find(h => h.host == hackedHost[i].name)) {
            continue
        }

        // Quick hack
        // We need to ensure that it return a valid number of thread for the hack
        let tr: number = ns.hackAnalyzeThreads(hackedHost[i].name, hackedHost[i].curMoney * 0.5)
        if (tr > 0) {
            potentialHack.push(new Hack(
                hackedHost[i].name,
                hackedHost[i].hackTime,
                hackedHost[i].curMoney * 0.5, // We aim for 50%
                Math.ceil(tr),
                0,
                0,
                hackedHost[i].curMoney * 0.5 / hackedHost[i].hackTime,
                HackType.quickMoneyHack
            ))
        }

        // Full hack
        // Thread required to grow to max:
        // max = old*(rate)^thread

        const serverGrowth = Math.min(1 + 0.03 / hackedHost[i].curSecurity, 1.0035)
        const growThread = Math.ceil((Math.log(hackedHost[i].maxMoney / hackedHost[i].curMoney) / Math.log(serverGrowth)) / hackedHost[i].growRate)

        if (!Number.isFinite(growThread) || growThread == 0) {
            continue
        }

        // Calculate Total Security, considering Grow
        const weakenThread = Math.ceil(((hackedHost[i].curSecurity - hackedHost[i].minSecurity) + (growThread * 0.004)) / 0.005)

        // Calculate Hacked Amount
        const percentHacked = ns.hackAnalyze(hackedHost[i].name)


        // Save full hack
        potentialHack.push(new Hack(
            hackedHost[i].name,
            hackedHost[i].maxMoney * 0.5, // We aim for 50%
            hackedHost[i].hackTime * 5,
            Math.ceil((hackedHost[i].maxMoney * 0.5) / (percentHacked * hackedHost[i].maxMoney)),
            growThread,
            weakenThread,
            hackedHost[i].maxMoney * 0.5 / hackedHost[i].hackTime * 5,
            HackType.fullMoneyHack
        ))
    }
    // Sort potentialHack by value.
    potentialHack.sort(hackSorter)

    DEBUG && ns.print("Got " + potentialHack.length + " hacks")
    DEBUG && ns.print("Got " + potentialHack.filter(hack => hack.hackType === HackType.quickMoneyHack).length + " quick hack")
    DEBUG && ns.print("Got " + potentialHack.filter(hack => hack.hackType === HackType.fullMoneyHack).length + " full hack")

    return potentialHack
}
