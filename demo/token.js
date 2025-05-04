class Token {
    static Number = "Number";
    static Op = "Op";
    static SelfIncDec = "SelfIncDec";
    static LParen = "LParen";
    static RParen = "RParen";
    static LBracket = "LBracket";
    static RBracket = "RBracket";
    static LBrace = "LBrace";
    static RBrace = "RBrace";
    static Semicolon = "Semicolon";
    static Comma = "Comma"; 
    static End = "End";

    static ID = "ID";
    static Assign = "Assign";
    static If = "If";
    static For = "For";
    static While = "While";
    static BuiltinFunction = "BuiltinFunction";
    static BuiltinConstant = "BuiltinConstant";
    static Def = "Def";
    static Return = "Return";
    static Dim = "Dim"; 

    static Continue = "Continue";
    static Break = "Break";

    type;
    lexeme;

    constructor(type, lexeme) {
        this.type = type;
        this.lexeme = lexeme;
    }
};

export default Token;