import { Symbol, SymbolTable } from "./symbolTable.js";
import { Label, LabelRef, LabelSet } from "./label.js";
import { INS } from "./ins.js";

class StackMachine {

    stack;
    symbolTable;

    pc;
    prog;
    callStack;
    relocations;
    fp;

    constructor(codeList) {
        this.pc = 0;
        this.prog = [];
        this.stack = [];
        this.callStack = [];
        this.symbolTable = SymbolTable.getInstance();
        this.relocations = [];
        this.labels = new Map();
        this.fp = 0;

        for (const code of codeList) {
            this.addCode(code);
        }

        this.resolveRelocations();
    }

    push(x) { this.stack.push(x); }
    pop() { return this.stack.pop(); }
    top() { return this.stack[this.stack.length - 1]; }

    getVar(name, newIfNoExist) {
        if (this.callStack.length > 0) {
            const func = this.symbolTable.getCurrentFunction();
            
            if (func && func.args.includes(name)) {
                const paramIndex = func.args.indexOf(name);
                const stackIndex = this.fp - 3 - func.args.length + paramIndex;

                if (stackIndex >= 0 && stackIndex < this.stack.length) {
                    return new Symbol(name, Symbol.Var, this.stack[stackIndex]);
                } else {
                    throw new Error(`Parameter ${name} not found in function ${func.name}.`);
                }
            }
        }

        const _var = this.symbolTable.get(name, newIfNoExist, Symbol.Var);
        return _var;
    }

    getFunc(name, newIfNoExist) {
        const func = this.symbolTable.get(name, newIfNoExist, Symbol.Function);
        return func;
    }

    getArray(name, newIfNoExist) {
        const _var = this.symbolTable.get(name, newIfNoExist, Symbol.Array);
        return _var;
    }

    BUILTIN_CONSTANTS = [
        ["e", Math.E],
        ["pi", Math.PI],
    ]

    init() {
        this.BUILTIN_CONSTANTS.map(item => this.symbolTable.addConst(item[0], item[1]));
    }

    addCode(ins) {
        if (typeof ins === "function") {
            ins = ins.bind(this);
        }

        if (ins instanceof LabelSet) {
            ins.set(this.prog.length);
            this.prog.push(INS.skip.bind(this));
            this.labels.set(ins.label, ins);
            return;
        }

        if (ins instanceof LabelRef) {
            ins.address = this.prog.length;
            this.prog.push(0);
            this.relocations.push(ins);
            return;
        }

        this.prog.push(ins);
    }

    resolveRelocations() {
        for (const ref of this.relocations) {
            const labelSet = this.labels.get(ref.label);
            if (!labelSet) {
                throw new Error(`Label ${ref.label} not found.`);
            }

            if (labelSet.address === null) {
                throw new Error(`Label ${ref.label} address not set.`);
            }

            this.prog[ref.address] = labelSet.address;
        }

        this.relocations = [];
    }

    reset() {
        this.pc = 0;
        this.stack = [];
        this.symbolTable.reset();

        this.init();
    }

    enterScope() {
        this.symbolTable.enterScope();
    }

    leaveScope() {
        this.symbolTable.leaveScope();
    }

    run() {
        this.reset();

        while (this.pc < this.prog.length) {
            const instruction = this.prog[this.pc++];
            instruction();
        }
    }
}

export default StackMachine;
