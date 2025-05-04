class Node {

    static epsilon = new Node("Epsilon", []);

    type;
    code;
    insCount;

    constructor(type, code) {
        this.type = type;
        this.code = code;
        this.insCount = this.code.length;
    }
}

export default Node;