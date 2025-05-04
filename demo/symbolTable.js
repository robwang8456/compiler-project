import { Env } from "./env.js";

export class Symbol {
    static Var = "var";
    static Const = "const";
    static Builtin = "builtin";
    static Function = "function";
    static Array = "array";

    type;
    name;

    pc;         // for function
    value;      // for var / const
    func;       // for builtin
    list;       // for array
    args;       // for arguments

    constructor(name, type, arg) {
        this.type = type;
        this.name = name;
        
        switch(type) {
            case Symbol.Const:
            case Symbol.Var:
                this.value = arg ?? 0;
                break;
            
            case Symbol.Builtin:
                if (typeof arg !== "function")
                    throw new Error(`Builtin functions must have a function as its implementation!`);

                this.func = arg;
                break;
            
            case Symbol.Function:
                this.func = arg ?? [];
                this.args = [];
                break;

            case Symbol.Array:
                this.list = arg ?? [];
                break;
            
            default:
                throw new Error(`Invalid symbol type: ${type}`);
        }
    }
}

export class SymbolTable {

    static instance;
    static getInstance() {
        if (!SymbolTable.instance) {
            SymbolTable.instance = new SymbolTable();
        }

        return SymbolTable.instance;
    }

    curEnv;
    scopeChain;
    curFunction;

    constructor() {
        this.curEnv = new Env();
        this.scopeChain = [this.curEnv];
    }

    reset() {
        this.curEnv = new Env();
        this.scopeChain = [this.curEnv];
        this.curFunction = null;
    }

    enterScope() {
        const newEnv = new Env(this.curEnv);
        this.scopeChain.push(newEnv);
        this.curEnv = newEnv;
    }

    leaveScope() {
        if (this.scopeChain.length <= 1) {
            throw new Error("Cannot leave global scope");
        }

        this.scopeChain.pop();
        this.curEnv = this.scopeChain[this.scopeChain.length - 1];
    }

    setCurrentFunction(func) {
        this.curFunction = func;
    }

    resetCurrentFunction() {
        this.curFunction = null;
    }

    getCurrentFunction() {
        return this.curFunction;
    }

    get(name, newIfNoExist, type) {
        let env = this.curEnv;
        
        while (env) {
            const symbol = env.getSymbol(name);
            
            if (symbol) {
                return symbol;
            }

            env = env.prev;
        }

        if (newIfNoExist) {
            const symbol = new Symbol(name, type);
            this.curEnv.addSymbol(name, symbol);
            return symbol;
        }

        throw new Error(`Variable ${name} is not declared`);
    }

    // Get builtin function reference
    getBuiltin(id) {
        if (!this.isBuiltin(id)) {
            throw new Error(`${id} is not a builtin function.`);
        }

        return this.get(id, false);
    }

    // Future TODO: check whether id is a builtin function or a custom function
    isBuiltin(id) {
        return true;
    }

    addBuiltin(id, func) {
        const symbol = new Symbol(id, Symbol.Builtin, func);
        this.curEnv.addSymbol(id, symbol);
    }

    addVar(id, value) {
        const symbol = new Symbol(id, Symbol.Var, value);
        this.curEnv.addSymbol(id, symbol);
    }

    addConst(id, value) {
        const symbol = new Symbol(id, Symbol.Const, value);
        this.curEnv.addSymbol(id, symbol);
    }
}