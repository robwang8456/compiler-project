import Token from "./token.js";
import Node from "./node.js";
import { INS } from "./ins.js";
import { BUILTIN_FUNCTIONS } from "./lex.js";
import { Label } from "./label.js";

const varUnaryOp = new Set(["++", "--"]);
const unaryOp = new Set([...varUnaryOp, "-", "!", "~"]);

const opInfo = new Map([
    [",", { text: "nop", rank: 1 }],
    ["=", { text: "assign", rank: 2 }],
    ["||", { text: "logicOr", rank: 3 }],
    ["&&", { text: "logicAnd", rank: 4 }],
    ["|", { text: "bitwiseOr", rank: 5 }],
    ["^", { text: "bitwiseXor", rank: 6 }],
    ["&", { text: "bitwiseAnd", rank: 7 }],
    ["!=", { text: "notEqual", rank: 8 }],
    ["==", { text: "equals", rank: 8 }],
    [">", { text: "greaterThan", rank: 9 }],
    ["<", { text: "lessThan", rank: 9 }],
    [">=", { text: "greaterThanOrEqual", rank: 9 }],
    ["<=", { text: "lessThanOrEqual", rank: 9 }],
    ["<<", { text: "leftShift", rank: 10 }],
    [">>", { text: "rightShift", rank: 10 }],
    ["+", { text: "add", rank: 11 }],
    ["-", { text: "sub", rank: 11, unaryText: "neg", unaryRank: 14 }],
    ["*", { text: "mul", rank: 12 }],
    ["/", { text: "div", rank: 12 }],
    ["%", { text: "modulo", rank: 12 }],
    ["!", { unaryText: "not", unaryRank: 14 }],
    ["~", { unaryText: "bitwiseNot", unaryRank: 14 }],
    ["++", { unaryText: "inc", unaryRank: 14 }],
    ["--", { unaryText: "dec", unaryRank: 14 }],
]);

function getOpRank(op) { return opInfo.get(op).rank; }
function getOpText(op) { return opInfo.get(op).text; }
function getUnaryText(op) { return opInfo.get(op).unaryText; }
function getOpInfo(op) { return opInfo.get(op); }

// new BNF with semantic action:
/* 
    prog         -> stmts END
    stmts        -> stmtUnit stmts | eps
    stmtUnit     -> blockStmt | stmt
    blockStmt    -> "{" stmts "}"

    stmt         -> assignStmt ";"
                  | funcExpr ";"
                  | exprStmt
                  | ifStmt 
                  | forStmt 
                  | whileStmt 
                  | funcDef
                  | returnStmt
                  | dimStmt ";"
                  | continue ";"
                  | break ";"
                  
    assignStmt   -> var "=" expr
    var          -> id | id "[" expr "]"

    funcExpr     -> builtinFunc "(" exprList ")"
                  | id "(" ")"
    exprList     -> expr exprList' | eps
    exprList'    -> "," exprList | eps

    exprStmt     -> expr ";"

    ifStmt       -> "if" "(" expr ")" stmtUnit
    forStmt      -> "for" "(" forInnerStmt ";" expr ";" forInnerStmt ")" stmtUnit
    forInnerStmt -> assignStmt | varExpr | eps
    whileStmt    -> "while" "(" expr ")" stmtUnit

    funcDef      -> "def" id "(" ")" "{" stmtUnit "}"
    returnStmt   -> "return" optExpr ";"
    optExpr      -> expr | eps

    dimStmt      -> "dim" id "[" number "]"

    continueStmt -> "continue" ";"
    breakStmt    -> "break" ";"
    
    expr -> term term'
    term' -> op term term'
           | op expr term'
           | eps
    term -> number
          | prefixUnaryExpr
          | postfixUnaryExpr
          | id 
          | funcExpr
          | const
          | "(" expr ")"

    prefixUnaryExpr -> prefixUnaryOp expr
    prefixUnaryOp   -> ++/--/!/~/-

    postfixUnaryExpr -> id postfixUnaryOp
    postfixUnaryOp   -> ++/--
*/
   
class Parser {

    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
        this.contextStack = [];
        this.loopStack = [];
        this.functionStack = [];
    }

    next() { this.index++; }
    get curType() { return this.lookahead.type; }
    get curLexeme() { return this.lookahead.lexeme; }
    get curToken() { return this.lookahead; }
    get lookahead() { return this.tokens[this.index]; }
    
    get nextType() { return this.tokens[this.index + 1]?.type; }
    get nextLexeme() { return this.tokens[this.index + 1]?.lexeme; }
    get nextToken() { return this.tokens[this.index + 1]; }
    
    saveContext() { this.contextStack.push(this.index); }
    loadContext() { this.index = this.contextStack.pop(); }
    resetContext() { this.contextStack.pop(); }

    pushLoopContext(continueLabel, breakLabel) { this.loopStack.push({ continueLabel, breakLabel }); }
    popLoopContext() { this.loopStack.pop(); }
    isInLoop() { return this.loopStack.length > 0; }
    getCurrentLoop() { return this.loopStack[this.loopStack.length - 1]; }

    pushFunctionContext() { this.functionStack.push(true); }
    popFunctionContext() { this.functionStack.pop(); }
    isInFunction() { return this.functionStack.length > 0; }

    unexpectedErr(expected, unexpected) {
        throw new Error(`${this.index} ${this.curType}"${expected}" expcted, but ${unexpected ?? this.lexeme} found.`);
    }

    expect(type, text) {
        if (this.curType === type) {
            this.next();
            return true;
        }

        if (text) this.unexpectedErr(text);

        return false;
    }
    
    // prog -> stmts END
    prog() {
        const stmts = this.stmts();
        const end = this.end();

        const node = new Node("Prog", [...stmts.code, ...end.code]);

        return node;
    }
    
    // stmts -> stmtUnit stmts | eps
    stmts() {
        if (this.stmtUnitFirst.has(this.curType)) {
            const stmtUnit = this.stmtUnit();
            const stmts = this.stmts();
            const node = new Node("Stmts", [...stmtUnit.code, ...stmts.code]);

            return node;
        }

        return Node.epsilon;
    }

    ifFirst = new Set([Token.If]);
    forFirst = new Set([Token.For]);
    whileFirst = new Set([Token.While]);
    funcFirst = new Set([Token.BuiltinFunction]);
    assignFirst = new Set([Token.ID]);
    defFirst = new Set([Token.Def]);
    returnFirst = new Set([Token.Return]);
    dimFirst = new Set([Token.Dim]);
    continueFirst = new Set([Token.Continue]);
    breakFirst = new Set([Token.Break]);

    stmtFirst = new Set([
        ...this.ifFirst,
        ...this.forFirst,
        ...this.whileFirst,
        ...this.funcFirst,
        ...this.assignFirst,
        ...this.defFirst,
        ...this.returnFirst,
        ...this.dimFirst,
        ...this.continueFirst,
        ...this.breakFirst,
        Token.SelfIncDec,
    ]);

    blockStmtFirst = new Set([Token.LBrace]);
    stmtUnitFirst = new Set([
        ...this.stmtFirst,
        ...this.blockStmtFirst,
    ]);

    exprFirst = new Set([Token.Number, Token.ID, Token.LParen, Token.Op, Token.BuiltinFunction, Token.BuiltinConstant, Token.SelfIncDec]);

    isUnaryOp(op) { return unaryOp.has(op); }
    isVarUnaryOp(op) { return varUnaryOp.has(op); }
    isExprFirst() {
        return (this.exprFirst.has(this.curType) || this.isUnaryOp(this.curLexeme));
    }

    // stmtUnit -> blockStmt | stmt
    stmtUnit() {
        if (this.blockStmtFirst.has(this.curType)) {
            return this.blockStmt();
        }

        return this.stmt();
    }

    // blockStmt -> "{" stmts "}"
    blockStmt() {
        this.expect(Token.LBrace, "{");
        const stmts = this.stmts();
        this.expect(Token.RBrace, "}");

        return new Node("blockStmt", [
            INS.enterBlock,
            ...stmts.code,
            INS.leaveBlock,
        ]);
    }

    isAssignFirst() {
        if (this.curType !== Token.ID)
            return false;

        const curIndex = this.index;

        while (this.curType !== Token.Semicolon 
            && this.curType !== Token.RParen
        ) {
            if (this.curType === Token.Assign) {
                this.index = curIndex;
                return true;
            }
            this.next();
        }

        this.index = curIndex;
        return false;
    }

    isDefFunc() {
        return this.curType === Token.ID && this.nextType === Token.LParen
    }

    // stmt -> assign ";" | funcExpr ";" | ifStmt | forStmt | whileStmt | exprStmt ";" | funcDef | returnStmt | dimStmt
    stmt() {
        // assignStmt
        if (this.isAssignFirst()) {
            const assignStmt = this.assignStmt();
            this.expect(Token.Semicolon, ";");
            
            return new Node("Assign", [...assignStmt.code, INS.discard]);
        }

        // funcExpr
        if (this.funcFirst.has(this.curType) || this.isDefFunc()) {
            const funcExpr = this.funcExpr();
            this.expect(Token.Semicolon, ";");

            return funcExpr;
        }

        // ifStmt
        if (this.ifFirst.has(this.curType)) {
            return this.ifStmt();
        }

        // forStmt
        if (this.forFirst.has(this.curType)) {
            return this.forStmt();
        }

        // whileStmt
        if (this.whileFirst.has(this.curType)) {
            return this.whileStmt();
        }

        // exprStmt
        if (this.exprFirst.has(this.curType)) {
            return this.exprStmt();
        }

        // funcDef
        if (this.defFirst.has(this.curType)) {
            return this.funcDef();
        }

        // returnStmt
        if (this.returnFirst.has(this.curType)) {
            return this.returnStmt();
        }

        // dimStmt
        if (this.dimFirst.has(this.curType)) {
            return this.dimStmt();
        }

        // continueStmt
        if (this.continueFirst.has(this.curType)) {
            return this.continueStmt();
        }

        // breakStmt
        if (this.breakFirst.has(this.curType)) {
            return this.breakStmt();
        }

        throw new Error(`Syntax Error: ${this.curLexeme} is unrecognized!`);
    }

    // exprStmt -> expr ";"
    exprStmt() {
        const expr = this.expr();
        this.expect(Token.Semicolon, ";");

        return new Node("ExprStmt", [...expr.code, INS.discard]);
    }

    // assign -> var "=" expr
    assignStmt() {
        const _var = this.var();
        this.expect(Token.Assign, "=");

        const assignFunc = _var.type === "ArrayElem" ? INS.assignArrElem : INS.assignVar;

        if (this.isAssignFirst()) {
            const rhs = this.assignStmt();
            return new Node("Assign", [
                ..._var.code,
                ...rhs.code,
                assignFunc,
            ])
        }

        const expr = this.expr();

        return new Node("Assign", [
            ..._var.code,
            ...expr.code, 
            assignFunc,
        ]);
    }

    // var -> id | id "[" expr "]"
    var() {
        if (this.curType !== Token.ID)
            this.unexpectedErr("variable name", this.curLexeme);

        const varName = this.curLexeme;
        this.next();

        if (this.curType === Token.LBracket) {
            this.next();
            const expr = this.expr();
            this.expect(Token.RBracket, "]");
            return new Node("ArrayElem", [
                ...expr.code, 
                INS.pushArr,
                varName,
                false,
            ]);
        }

        const isArr = this.arrList.includes(varName);
        return new Node(isArr ? "Array" : "Var", [
            isArr ? INS.pushArr : INS.pushVar, 
            varName, 
            !this.isFuncExpr
        ]);
    }

    // First(builtinFunc)
    builtinFunctionFirst = new Set(BUILTIN_FUNCTIONS);

    isFuncExpr = false;
    // funcExpr -> builtinFunc "(" expr ")" {code(builtinFunc)}
    //           | id "(" exprList ")" {code(func)}
    funcExpr() {
        this.isFuncExpr = true;

        // Builtin Functions
        if (this.curType === Token.BuiltinFunction) {
            const func = INS.getBuiltinFunc(this.curLexeme);
            this.next();
    
            this.expect(Token.LParen, "(");
            const exprList = this.exprList();
            this.expect(Token.RParen, ")");

            this.isFuncExpr = false;
    
            return new Node("FuncExpr", [...exprList.code, func]);
        }

        // User defined functions
        if (this.isDefFunc()) {
            const funcName = this.curLexeme;
            this.next();

            this.expect(Token.LParen, "(");
            const exprList = this.exprList();
            this.expect(Token.RParen, ")");

            this.isFuncExpr = false;
    
            return new Node("FuncExpr", [
                ...exprList.code,
                INS.pushFunc, 
                funcName, 
                INS.call,
            ]);
        }

        this.isFuncExpr = false;
        this.unexpectedErr("function name", this.curLexeme);
    }

    // exprList -> expr exprList' | eps 
    exprList() {
        if (!this.isExprFirst()) {
            return Node.epsilon;
        }

        const expr = this.expr();
        const ext = this.exprListExt();

        return new Node("ExprList", [...expr.code, ...ext.code]); 
    }

    // exprList' -> "," exprList | eps
    exprListExt() {
        if (this.curType !== Token.Comma)
            return Node.epsilon;

        this.next();
        return this.exprList();
    }

    // ifStmt -> "if" "(" expr ")" stmtUnit
    ifStmt() {
        this.expect(Token.If, "if");
        this.expect(Token.LParen, "(");

        const expr = this.expr();

        this.expect(Token.RParen, ")");

        const stmtUnit = this.stmtUnit();

        const skipLabel = new Label();

        return new Node("ifStmt", [
            ...expr.code, 
            INS._if, 
            skipLabel.REF,
            ...stmtUnit.code,
            skipLabel.SET,
        ]);
    }

    // forStmt -> "for" "(" forInnerStmt ";" expr ";" forInnerStmt ")" stmtUnit
    forStmt() {
        this.expect(Token.For, "for");
        this.expect(Token.LParen, "(");

        const init = this.forInnerStmt();
        this.expect(Token.Semicolon, ";");

        const expr = this.expr();
        this.expect(Token.Semicolon, ";");

        const step = this.forInnerStmt();
        this.expect(Token.RParen, ")");

        const skipLabel = new Label();
        const loopLabel = new Label();
        const stepLabel = new Label();
        this.pushLoopContext(stepLabel, skipLabel);

        const stmtUnit = this.stmtUnit();

        const loopNode = new Node("forStmt", [
            ...init.code,
            loopLabel.SET,
            ...expr.code,
            INS._for,
            skipLabel.REF,
            ...stmtUnit.code,
            stepLabel.SET,
            ...step.code,
            INS.jumpAbs,
            loopLabel.REF,
            skipLabel.SET,
        ]);
        this.popLoopContext();

        return loopNode;
    }

    // forInnerStmt -> assignStmt | varExpr | Eps
    forInnerStmt() {
        if (this.isAssignFirst()) {
            return new Node("Assign", [...this.assignStmt().code, INS.discard]);
        }

        if (this.varExprFirst.has(this.curType)) {
            const varExpr = this.varExpr();
            return new Node("ForInnerStmt", [...varExpr.code, INS.discard]);
        }

        return Node.epsilon;
    }

    // whileStmt -> "while" "(" expr ")" stmtUnit
    whileStmt() {
        this.expect(Token.While, "while");
        this.expect(Token.LParen, "(");

        const expr = this.expr();
        this.expect(Token.RParen, ")");
        
        const skipLabel = new Label();
        const loopLabel = new Label();
        this.pushLoopContext(loopLabel, skipLabel);

        const stmtUnit = this.stmtUnit();

        const loopNode = new Node("whileStmt", [
            loopLabel.SET,
            ...expr.code,
            INS._while, 
            skipLabel.REF,
            ...stmtUnit.code,
            INS.jumpAbs,
            loopLabel.REF,
            skipLabel.SET,
        ]);
        this.popLoopContext();

        return loopNode;
    }

    // continueStmt -> "continue" ";"
    continueStmt() {
        this.expect(Token.Continue, "continue");
        this.expect(Token.Semicolon, ";");

        if (!this.isInLoop()) {
            throw new Error(`Error: "continue" statement must be inside a loop!`);
        }

        return new Node("ContinueStmt", [
            INS.jumpAbs, 
            this.getCurrentLoop().continueLabel.REF,
        ]);
    }

    // breakStmt -> "break" ";"
    breakStmt() {
        this.expect(Token.Break, "break");
        this.expect(Token.Semicolon, ";");

        if (!this.isInLoop()) {
            throw new Error(`Error: "break" statement must be inside a loop!`);
        }

        return new Node("BreakStmt", [
            INS.jumpAbs, 
            this.getCurrentLoop().breakLabel.REF,
        ]);
    }

    // funcDef -> "def" id "(" argList ")" "{" stmtUnit "}"
    funcDef() {
        this.expect(Token.Def, "def");
        const funcName = this.curLexeme;
        this.next();

        this.expect(Token.LParen, "(");
        const argList = this.argList();
        const argCount = argList.length;
        this.expect(Token.RParen, ")");

        this.expect(Token.LBrace, "{");

        this.pushFunctionContext();
        const stmts = this.stmts();
        this.popFunctionContext();

        this.expect(Token.RBrace, "}");

        return new Node("FuncDef", [
            INS.funcDef,
            funcName,
            argCount,
            ...argList,
            stmts.insCount + 2,
            INS.enterFuncBlock,
            ...stmts.code,
            INS.leaveFuncBlock,
        ])
    }

    argList() {
        const args = [];
    
        if (this.curType !== Token.RParen) {
            while (true) {
                if (this.curType === Token.ID) {
                    args.push(this.curLexeme);
                    this.next();
                }
    
                if (this.curType === Token.Comma) {
                    this.next();
                } else {
                    break;
                }
            }
        }
    
        return args;
    }

    // returnStmt -> "return" optExpr ";"
    returnStmt() {
        this.expect(Token.Return, "return");

        if (!this.isInFunction()) {
            throw new Error(`Error: "return" statement must be inside a function!`);
        }

        const optExpr = this.optExpr();
        this.expect(Token.Semicolon, ";");

        return new Node("Return", [...optExpr.code, INS._return, optExpr === Node.epsilon]);
    }

    // optExpr -> expr | eps
    optExpr() {
        if (this.isExprFirst()) {
            return this.expr();
        }

        return Node.epsilon;
    }

    // dimExpr -> "dim" id "[" expr "]" ";"
    arrList = [];
    dimStmt() {
        this.expect(Token.Dim, "dim");
        if (this.curType !== Token.ID)
            this.unexpectedErr("variable name");

        const varName = this.curLexeme;
        this.arrList.push(varName);
        this.next();

        this.expect(Token.LBracket, "[");
        const number = this.expr();
        this.expect(Token.RBracket, "]");

        this.expect(Token.Semicolon, ";");

        return new Node("DimStmt", [
            ...number.code,
            INS.dim,
            varName,
        ]);
    }

    // expr -> term term'
    expr() {
        const term = this.term();
        const termExt = this.termExt();
        return new Node("Expr", [...term.code, ...termExt.code]);
    }

    varExprFirst = new Set([Token.SelfIncDec, Token.ID]);

    // term -> number
    //       | builtinConstant
    //       | funcExpr
    //       | enclosedExpr
    //       | unaryExpr
    //       | varExpr
    //       | assignExpr "x = 5"

    term() {
        // funcExpr
        if (this.curType === Token.BuiltinFunction || (this.curType === Token.ID && this.nextType === Token.LParen)) {
            const funcExpr = this.funcExpr();
            return new Node("FuncExpr", [...funcExpr.code]);
        }

        // varExpr
        if (this.varExprFirst.has(this.curType)) {
            return this.varExpr();
        }
        
        //number
        if (this.curType === Token.Number) {
            const number = this.curLexeme;
            const node = new Node("Number", [INS.pushConst, number]);
    
            this.next();
            return node;
        }

        // constant
        if (this.curType === Token.BuiltinConstant) {
            const id = this.curLexeme;
            const node = new Node("Constant", [INS.pushVar, id, false, INS.extractVar]);

            this.next();
            return node;
        }

        // enclosedExpr
        if (this.curType === Token.LParen) {
            const enclosedExpr = this.enclosedExpr();
            return new Node("Expr", [...enclosedExpr.code]);
        }

        // unaryExpr
        if (this.isUnaryOp(this.curLexeme)) {
            return this.unaryExpr();
        }
        
        this.unexpectedErr("Term");
    }

    // termExt -> op term term'
    //          | op expr term'
    //          | eps
    // TODO: Need to implement backtracking. After encountering the first Op1, save context, analyze the next term'. Check the op2 in term' precedence, if op2 > op1, use expr, if op1 >= op2, use term.
    termExt() {        
        if (this.curType !== Token.Op) {
            return new Node("Eps", []);
        }

        const op = this.curLexeme;
        const opPrecedence = getOpRank(op);
        const opText = getOpText(op);
        const code = INS.getBuiltinFunc(opText);
        this.next();
        this.saveContext();

        // Treat the next token as term
        const nextTerm = this.term();

        if (this.curType === Token.Op) {
            const nextOp = this.curLexeme;
            const nextOpPrecedence = getOpRank(nextOp);
            
            if (nextOpPrecedence > opPrecedence) {
                this.loadContext();
                const expr = this.expr();
                const termExt = this.termExt();
                const node = new Node("TermExt", [...expr.code, ...termExt.code]);

                return node;
            }

        }

        this.resetContext();
        const termExt = this.termExt();
        const node = new Node("TermExt", [...nextTerm.code, code, ...termExt.code]);

        return node;
    }

    // enclosedExpr -> lparen expr rparen
    enclosedExpr() {
        do {
            if (this.curType !== Token.LParen)
                break;
            this.next();

            const expr = this.expr();

            if (this.curType !== Token.RParen)
                break;
            this.next();

            return expr;
        } while (false);

        throw new Error(`'(...)' expected, but [${this.curLexeme}] found!`);
    }

    getVarUnaryFunc(op, prefix) {
        if (prefix) {
            if (op === "++") return INS.prefixInc;
            if (op === "--") return INS.prefixDec;
        }

        if (op === "++") return INS.postfixInc;
        if (op === "--") return INS.postfixDec;
        
        throw new Error(`Invalid unary operator: ${op}`);
    }

    getArrElemUnaryFunc(op, prefix) {
        if (prefix) {
            if (op === "++") return INS.prefixIncArr;
            if (op === "--") return INS.prefixDecArr;
        }

        if (op === "++") return INS.postfixIncArr;
        if (op === "--") return INS.postfixDecArr;
    }

    // varExpr -> var
    //          | var postfixOp
    //          | prefixOp var
    varExpr() {
        let postfixFunc;
        let prefixFunc;
        let isArr;

        const prefix = this.curLexeme;
        if (this.isVarUnaryOp(this.curLexeme)) {
            prefixFunc = this.getVarUnaryFunc(this.curLexeme, true);
            this.next();
        }

        const _var = this.var();

        if (_var.type === "Array") {
            return _var;
        }

        isArr = _var.type === "ArrayElem";

        if (isArr && prefixFunc) prefixFunc = this.getArrElemUnaryFunc(prefix, true);

        if (!prefixFunc && this.isVarUnaryOp(this.curLexeme)) {
            if (isArr) 
                postfixFunc = this.getArrElemUnaryFunc(this.curLexeme, false);
            else
                postfixFunc = this.getVarUnaryFunc(this.curLexeme, false);

            this.next();
        }

        const extractFunc = isArr ? INS.extractArrElem : INS.extractVar;

        return new Node("Term", [
            ..._var.code,
            prefixFunc ?? postfixFunc ?? extractFunc,
        ]);
    }

    // unaryExpr -> unaryOp expr
    unaryExpr() {
        const code = INS.getUnaryFunc(this.curLexeme);
        this.next();
        
        const expr = this.expr();
        return new Node("Term", [...expr.code, code]);
    }

    end() {
        const node = new Node("End", []);

        return node;
    }

    parse() {
        try {
            const prog = this.prog();
            return prog.code;
        } catch (err) {
            console.log("Error: ", err.message);
            process.exit(-1);
        }
    }
}

export default Parser;