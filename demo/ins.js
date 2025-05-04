
function pushVar() { const id = this.prog[this.pc++]; const newIfNoExist = this.prog[this.pc++]; const _var = this.getVar(id, newIfNoExist); this.push(_var); }
function pushConst() { const val = this.prog[this.pc++]; this.push(val); }
function pushFunc() { const id = this.prog[this.pc++]; const func = this.getFunc(id, false); this.push(func); }
function pushArr() { const id = this.prog[this.pc++]; this.pc++; const arr = this.getArray(id, false); this.push(arr); }

function dim() {
    const id = this.prog[this.pc++];
    const size = this.pop();
    const arr = this.getArray(id, true);
    arr.list = new Array(size).fill(0);
}

function add() { const y = this.pop(); const x = this.pop(); const z = x + y; this.push(z); }
function sub() { const y = this.pop(); const x = this.pop(); const z = x - y; this.push(z); }
function mul() { const y = this.pop(); const x = this.pop(); const z = x * y; this.push(z); }
function div() { const y = this.pop(); const x = this.pop(); const z = x / y; this.push(z); }
function modulo() { const y = this.pop(); const x = this.pop(); const z = x % y; this.push(z); }
function sin() { const x = this.pop(); const r = Math.sin(x); this.push(r); }
function cos() { const x = this.pop(); const r = Math.cos(x); this.push(r); }
function print() { const value = this.pop(); console.log(value ?? ""); }
function int() { const x = this.pop(); this.push(Math.floor(x)); }
function atan() { const x = this.pop(); const r = Math.atan(x); this.push(r); }
function tan() { const x = this.pop(); const r = Math.tan(x); this.push(r); }
function exp() { const x = this.pop(); this.push(Math.exp(x)); }
function log() { const x = this.pop(); this.push(Math.log(x)); }
function log10() { const x = this.pop(); this.push(Math.log10(x)); }
function round() { const x = this.pop(); this.push(Math.round(x)); }
function pow() { const exp = this.pop(); const x = this.pop(); this.push(Math.pow(x, exp)); }
function sqrt() { const x = this.pop(); this.push(Math.sqrt(x)); }
function rand() { this.push(Math.random()); }
function neg() { const x = this.pop(); const z = -x; this.push(z); }

function prefixInc() { const _var = this.pop(); this.push(++_var.value); }
function postfixInc() { const _var = this.pop(); this.push(_var.value++); }
function prefixDec() { const _var = this.pop(); this.push(--_var.value); }
function postfixDec() { const _var = this.pop(); this.push(_var.value--); }

function prefixIncArr() { const arr = this.pop(); const index = this.pop(); this.push(++arr.list[index]); }
function postfixIncArr() { const arr = this.pop(); const index = this.pop(); this.push(arr.list[index]++); }
function prefixDecArr() { const arr = this.pop(); const index = this.pop(); this.push(--arr.list[index]); }
function postfixDecArr() { const arr = this.pop(); const index = this.pop(); this.push(arr.list[index]--); }

function assignVar() { const val = this.pop(); const _var = this.pop(); _var.value = val; this.push(val); }
function assignArrElem() { const val = this.pop(); const arr = this.pop(); const index = this.pop(); arr.list[index] = val; this.push(val); }

function extractVar() { const _var = this.pop(); this.push(_var.value); }
function extractArrElem() { const arr = this.pop(); const index = this.pop(); this.push(arr.list[index]); }

function nop() {}
function logicAnd() { const x = this.pop(); const y = this.pop(); const z = x && y; this.push(z); }
function logicOr() { const x = this.pop(); const y = this.pop(); const z = x || y; this.push(z); }
function not() { const x = this.pop(); const z = !x; this.push(z); }
function greaterThanOrEqual() { const y = this.pop(); const x = this.pop(); const z = x >= y; this.push(z); }
function greaterThan() { const y = this.pop(); const x = this.pop(); const z = x > y; this.push(z); }
function lessThan() { const y = this.pop(); const x = this.pop(); const z = x < y; this.push(z); }
function lessThanOrEqual() { const y = this.pop(); const x = this.pop(); const z = x <= y; this.push(z); }
function equals() { const y = this.pop(); const x = this.pop(); const z = x == y; this.push(z); }
function notEqual() { const y = this.pop(); const x = this.pop(); const z = x != y; this.push(z); }
function bitwiseAnd() { const y = this.pop(); const x = this.pop(); const z = x & y; this.push(z); }
function bitwiseXor() { const y = this.pop(); const x = this.pop(); const z = x ^ y; this.push(z); }
function bitwiseOr() { const y = this.pop(); const x = this.pop(); const z = x | y; this.push(z); }
function bitwiseNot() { const x = this.pop(); const z = ~x; this.push(z); }
function rightShift() { const y = this.pop(); const x = this.pop(); const z = x >> y; this.push(z); }
function leftShift() { const y = this.pop(); const x = this.pop(); const z = x << y; this.push(z); }

function getBuiltinFunc(funcName) { return INS[funcName]; }
function getUnaryFunc(funcName) { return INS[funcName]; }

function _if() {
    const cond = this.pop();
    const targetPc = this.prog[this.pc++];

    if (!cond) {
        this.pc = targetPc;
        // this.pop();
    }
}

function _for() {
    const cond = this.pop();
    const targetPc = this.prog[this.pc++];

    if (!cond) {
        this.pc = targetPc;
    }
}

function _while() {
    const cond = this.pop();
    const targetPc = this.prog[this.pc++];

    if (!cond) {
        this.pc = targetPc;
    }
}

function jumpRel() { const dist = this.prog[this.pc++]; this.pc += dist; }
function jumpAbs() { const newPc = this.prog[this.pc++]; this.pc = newPc; }

function discard() { this.pop(); }

function funcDef() {
    const funcName = this.prog[this.pc++];
    const argCount = this.prog[this.pc++];

    const func = this.getFunc(funcName, true);
    
    // Get arg names
    for (let i = 0; i < argCount; i++) {
        func.args.push(this.prog[this.pc++]);
    }

    const funcCount = this.prog[this.pc++];
    func.startPc = this.pc;
    for (let i = 0; i < funcCount; i++) {
        func.func.push(this.prog[this.pc++]);
    }
    func.endPc = this.pc;
}

function call() {
    const func = this.top();
    this.callStack.push(this.pc);
    this.pc = func.startPc;
}

function _return() {
    const emptyReturn = this.prog[this.pc++];
    let returnValue;

    if (!emptyReturn) {
        returnValue = this.pop();
    }
    const returnPc = this.callStack.pop();

    this.fp = this.pop();
    const argCount = this.pop();
    for (let i = 0; i < argCount + 1; i++) {
        this.pop();
    }

    this.pc = returnPc;
    if (!emptyReturn) {
        this.push(returnValue);
    }
}

function enterBlock() { this.enterScope(); }
function leaveBlock() { this.leaveScope(); }

function enterFuncBlock() {
    const func = this.pop();
    
    this.push(this.callStack[this.callStack.length - 1]); // Save return address
    this.push(func.args.length); // Save arg count
    this.push(this.fp); // Save frame pointer
    this.fp = this.stack.length; // Set new frame pointer

    this.symbolTable.setCurrentFunction(func); // Set current function in symbol table
}

function leaveFuncBlock() {
    this.fp = this.pop();
    this.pop();
    this.symbolTable.resetCurrentFunction();
    this.leaveScope();
}

function skip() {}

export const INS = {

    pushVar,
    pushConst,
    pushFunc,
    pushArr,

    // Arith Op
    add,
    sub,
    mul,
    div,
    modulo,
    sin,
    cos,
    print,
    int,
    atan,
    tan,
    exp,
    log,
    log10,
    round,
    pow,
    sqrt,
    rand,
    neg,
    
    prefixInc,
    postfixInc,
    prefixDec,
    postfixDec,

    prefixIncArr,
    postfixIncArr,
    prefixDecArr,
    postfixDecArr,

    assignVar,
    assignArrElem,
    extractVar,
    extractArrElem,

    // Bitwise Op
    nop,
    logicAnd,
    logicOr,
    not,
    greaterThanOrEqual,
    greaterThan,
    lessThan,
    lessThanOrEqual,
    equals,
    notEqual,
    bitwiseAnd,
    bitwiseXor,
    bitwiseOr,
    bitwiseNot,
    rightShift,
    leftShift,

    getBuiltinFunc,
    getUnaryFunc,

    _if,
    _for,
    _while,
    jumpRel,
    jumpAbs,
    discard,

    funcDef,
    call,
    _return,

    dim,

    enterBlock,
    leaveBlock,
    enterFuncBlock,
    leaveFuncBlock,

    skip,
}
