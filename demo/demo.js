import process from "node:process";
import StackMachine from "./stackMachine.js";
import Lex from "./lex.js";
import Parser from "./parser.js";

const DEFAULT_ARG = `

    // -----------------------------------------------
    // Sieve of Eratosthenes
    // def sieve(n) {
    //     dim isPrimes[n + 1];

    //     for (i = 2; i <= n; i++) {
    //         isPrimes[i] = 1;
    //     }

    //     isPrimes[0] = 0;
    //     isPrimes[1] = 0;

    //     for (i = 2; i * i <= n; i++) {
    //         if (isPrimes[i] == 1) {
    //             for (j = i * i; j <= n; j = j + i) {
    //                 isPrimes[j] = 0;
    //             }
    //         }
    //     }

    //     for (i = 2; i <= n; i++) {
    //         if (isPrimes[i] == 1) {
    //             print(i);
    //         }
    //     }

    //     return;
    // }

    // sieve(100);
    // -----------------------------------------------

    // -----------------------------------------------
    // Quick Sort
    def quickSort(arr, low, high) {
        if (low < high) {
            pivot = partition(arr, low, high);
            quickSort(arr, low, pivot - 1);
            quickSort(arr, pivot + 1, high);
        }
        return;
    }

    def partition(arr, low, high) {
        pivot = arr[high];
        i = low - 1;

        for (j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }

        temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;

        return i + 1;
    }

    // Init array of 10 random numbers between 0 and 100
    dim arr[10];
    for (i = 0; i < 10; i++) {
        arr[i] = int(rand() * 100);
        print(arr[i]);
    }
    print();

    quickSort(arr, 0, 9);

    // Print sorted array
    for (i = 0; i < 10; i++) {
        print(arr[i]);
    }
    // -----------------------------------------------

    // -----------------------------------------------
    // Fibonacci
    // def fib(n) {
    //     if (n <= 1) {
    //         return n;
    //     }
    //     return fib(n - 1) + fib(n - 2);
    // }

    // print();
    // for (i = 0; i < 10; i++) {
    //     print(fib(i));
    // }
    // -----------------------------------------------
`;

function getArg() {
    return process.argv[2] ?? DEFAULT_ARG;
}

const inputs = getArg();
console.log(inputs);

const lex = new Lex(inputs);
const tokenList = lex.scan();
let i = 0;
// tokenList.map((token) => console.log(i++, token));

const parser = new Parser(tokenList);
const codeList = parser.parse();
// codeList.map((code) => console.log(i++, code.name ?? code));

const machine = new StackMachine(codeList);
// i = 0;
// machine.prog.map((code) => console.log(i++, code.name ?? code));
machine.run();
// console.log(machine.symbolTable);
// console.log(machine.stack);