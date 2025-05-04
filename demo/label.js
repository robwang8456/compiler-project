export class Label {
    constructor() {
        this.set = null;
        this.refs = [];
    }

    get SET() {
        if (!this.set) {
            this.set = new LabelSet(this);
        }
        return this.set;
    }

    get REF() {
        const ref = new LabelRef(this);
        this.refs.push(ref);
        return ref;
    }
}

export class LabelSet {
    constructor(label) {
        this.label = label;
        this.address = null;
    }

    set(address) {
        this.address = address;
    }

    make(machine) {
        if (this.address !== null) {
            console.error("LabelSet already has an address.");
        }
        this.address = machine.ip;
        machine.prog[this.address] = 0;
    }
}

export class LabelRef {
    constructor(label) {
        this.label = label;
        this.address = null;
    }

    ref(address) {
        this.address = address;
    }

    make(machine) {
        if (this.label.set === null || this.label.set.address === null) {
            throw new Error("Label set address not yet determined.");
        }
        if (this.address === null) {
            throw new Error("Label reference address not set.");
        }
        machine.prog[this.address] = this.label.set.address;
    }
}
