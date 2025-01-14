export class Hack {
    constructor(host, hackTime, hackValue, hackThreads, growThreads, weakenThreads, relativeValue, hackType, hackChance) {
        this.host = host;
        this.hackTime = hackTime;
        this.hackValue = hackValue;
        this.hackThreads = Math.round(hackThreads);
        this.growThreads = Math.round(growThreads);
        this.weakenThreads = Math.round(weakenThreads);
        this.relativeValue = relativeValue;
        this.hackType = hackType;
        this.hackChance = hackChance;
        this.id = null;
    }
    get growTime() {
        return this.hackTime * 3.2;
    }
    get weakenTime() {
        return this.hackTime * 4;
    }
    static fromJSON(json) {
        const { host, hackTime, hackValue, hackThreads, growThreads, weakenThreads, relativeValue, hackType, hackChance } = JSON.parse(json);
        return new Hack(host, hackTime, hackValue, hackThreads, growThreads, weakenThreads, relativeValue, hackType, hackChance);
    }
}
export class HackedHost {
    constructor(ns, host) {
        this.name = host;
        this.hackTime = ns.getHackTime(host);
        this.growRate = ns.getServerGrowth(host) / 100;
        this.minSecurity = ns.getServerMinSecurityLevel(host);
        this.maxMoney = ns.getServerMaxMoney(host);
        this.ram = ns.getServerMaxRam(host);
        this.hackingRequired = ns.getServerRequiredHackingLevel(host);
    }
    get growTime() {
        return this.hackTime * 3.2;
    }
    get weakenTime() {
        return this.hackTime * 4;
    }
}
// export const hackSorter = (a: Hack, b: Hack): number => {
//     if (a.hackTime < b.hackTime) {
//         return -1
//     }
//     if (a.hackTime > b.hackTime) {
//         return 1
//     }
//     return 0
// }
export const hackSorter = (a, b) => {
    if (a.relativeValue < b.relativeValue) {
        return 1;
    }
    if (a.relativeValue > b.relativeValue) {
        return -1;
    }
    return 0;
};
