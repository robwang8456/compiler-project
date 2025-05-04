import Token from "./token.js";

export const BUILTIN_FUNCTIONS = ["print", "sin", "cos", "int", "atan", "tan", "exp", "log", "log10", "round", "pow", "sqrt", "rand"];
export const BUILTIN_CONSTANTS = ["pi", "e"];

class Lex {

    inputs;
    index;
    length;

    constructor(inputs) {
        this.inputs = inputs;
        this.index = 0;
        this.length = inputs.length;
    }

    next(len) { this.index += len ?? 1; }
    get ch() { return this.inputs[this.index]; }
    get nextCh() { return this.inputs[this.index + 1]; }
    get restText() { return this.inputs.substring(this.index); }
    subText(len) { return this.inputs.substring(this.index, this.index + len); }

    skipWs() {
        while (this.ch === " "
            || this.ch === "\n"
            || this.ch === "\t"
        ) {
            this.next();
        }

        if (this.subText(2) === "//") {
            while (this.ch !== '\n' && this.ch !== undefined) {
                this.next();
            }

            if (this.ch === '\n') {
                this.next();
            }

            this.skipWs();
        }

    }

    scanID() {
        let id = "";
        while ((this.ch >= 'a' && this.ch <= 'z' )
            || (this.ch >= 'A' && this.ch <= 'Z') 
            || (this.ch >= '0' && this.ch <= '9' && id.length > 0)
        ) {
            id += this.ch;
            this.next();
        }

        if (id.length) {
            if (BUILTIN_FUNCTIONS.includes(id)) return new Token(Token.BuiltinFunction, id); 
            if (BUILTIN_CONSTANTS.includes(id)) return new Token(Token.BuiltinConstant, id);
            if (id === "if") return new Token(Token.If, id);
            if (id === "while") return new Token(Token.While, id);
            if (id === "for") return new Token(Token.For, id);
            if (id === "def") return new Token(Token.Def, id);
            if (id === "return") return new Token(Token.Return, id);
            if (id === "dim") return new Token(Token.Dim, id);
            if (id === "break") return new Token(Token.Break, id);
            if (id === "continue") return new Token(Token.Continue, id);
    
            return new Token(Token.ID, id);
        }
    }

    scanNumber() {
        let num = "";
        while (this.ch >= '0' && this.ch <= '9') {
            num += this.ch;
            this.next();
        }

        if (this.ch === '.') {
            num += this.ch;
            this.next();

            while (this.ch >= '0' && this.ch <= '9') {
                num += this.ch;
                this.next();
            }
        }

        if (num.length)
            return new Token(Token.Number, parseFloat(num));
    }

    opSet = new Set([
        "+", "-", "*", "/",
        "&&", "||", "!", ">=", ">", "<", "<=", "!=", "==",
        "&", "^", "|", "~", "%", ">>", "<<",
        "++", "--",
    ])

    scanOp() {
        const ch2 = this.ch + this.nextCh;
        if (this.opSet.has(ch2)) {
            if (ch2 === "++" || ch2 === "--") {
                const token = new Token(Token.SelfIncDec, ch2);
                this.next();
                this.next();
                return token;
            }
            
            const token = new Token(Token.Op, ch2);
            this.next();
            this.next();
            return token;
        }

        if (this.opSet.has(this.ch)) {
            const token = new Token(Token.Op, this.ch);
            this.next();
            return token;
        }
    }

    scanOneSymbol(symbol, type) {
        if (this.subText(symbol.length) === symbol) {
            this.next(symbol.length);

            return new Token(type, symbol);
        }
    }

    symbolInfo = [
        ["=", Token.Assign],
        [";", Token.Semicolon],
        ["(", Token.LParen],
        [")", Token.RParen],
        ["[", Token.LBracket],
        ["]", Token.RBracket],
        ["{", Token.LBrace],
        ["}", Token.RBrace],
        [",", Token.Comma],
    ];

    scanSymbol() {
        let token;
        for (const si of this.symbolInfo) {
            if (token = this.scanOneSymbol(si[0], si[1]))
                return token;
        }
    }

    getToken() {
        this.skipWs();

        let token;
        const ch = this.ch;

        if (token = this.scanOp()) return token;
        if (token = this.scanID()) return token;
        if (token = this.scanNumber()) return token;
        if (token = this.scanSymbol()) return token;

        if (ch === undefined) { return new Token(Token.End, "###"); }

        error(`[${ch}] is not a legal char!`);
    }

    scan() {
        try {
            const tokens = [];

            while (this.index < this.length) {
                const token = this.getToken();
                tokens.push(token);
            }

            if (tokens[tokens.length - 1].type !== Token.End) {
                tokens.push(new Token(Token.End, "###"));
            }

            return tokens;
        }
        catch (err) {
            console.log("Err: ", err.message);
            process.exit(-1);
        }
    }

};

export default Lex;