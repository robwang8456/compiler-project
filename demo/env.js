import { Symbol } from "./symbolTable.js";

export class Env {
    constructor(prev = null) {
        this.prev = prev;
        this.symbols = new Map();
    }

    addSymbol(name, symbol) {
        this.symbols.set(name, symbol);
    }

    getSymbol(name) {
        if (this.symbols.has(name)) {
            return this.symbols.get(name);
        }
        
        if (this.prev) {
            return this.prev.getSymbol(name);
        }
        
        return null;
    }

    hasSymbol(name) {
        return this.symbols.has(name);
    }
}