# My Custom Programming Language

This repository contains the source code for my personal programming language, implemented in JavaScript. This project was undertaken to deepen my understanding of compiler design principles and language implementation.

## Features

The language currently supports the following features:

* **Lexical Analysis:** Breaks down the source code into a stream of tokens.
* **Syntactic Analysis (Parsing):** Constructs an abstract syntax tree (AST) from the tokens, verifying the program's structure.
* **Intermediate Code Generation:** Translates the AST into an intermediate representation for easier execution.
* **Control Flow:**
    * `if` statements for conditional execution.
    * `for` and `while` loops for iterative execution.
    * `continue` and `break` keywords for loop control.
* **Scoping:** Manages the visibility and lifetime of variables using stack frames.
* **Variables:** Supports the declaration and assignment of variables.
* **Arrays:** Allows for the creation and manipulation of ordered collections of data.
* **Functions:**
    * Built-in functions providing core functionalities.
    * User-defined functions allowing for code modularity and reuse.

## Current Development

I am currently focusing on optimizing the language's performance. The immediate area of work is dead code elimination and value numbering.

## Getting Started

Since the language is implemented in JavaScript, you can run the components using Node.js.

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Ensure you have Node.js installed.** You can download it from [https://nodejs.org/](https://nodejs.org/).

3.  **Navigate to the relevant directory** containing the entry point of your language

## Demo Project

The `demo` folder provides a way to run example programs written in the custom programming language. It includes the following examples:

* **Sieve of Eratosthenes:** An algorithm for finding all prime numbers up to a specified integer.
* **Quick Sort:** An efficient, general-purpose, divide-and-conquer sorting algorithm.
* **Fibonacci Series:** A sequence in which each number is the sum of the two preceding ones.

### Running the Demo

There are two ways to run programs using `demo.js`:

#### 1.  Using the `DEFAULT_ARG` Variable (Recommended)

   The recommended way to write your own program is to modify the `DEFAULT_ARG` variable within the `demo.js` file. This variable holds the code for the program to be executed.

   1.  **Edit `demo.js`:** Open the `demo.js` file in a text editor.
   2.  **Modify `DEFAULT_ARG`:** Locate the `DEFAULT_ARG` variable and replace its value with the code for the desired program. You can use the provided examples (Sieve of Eratosthenes, Quick Sort, Fibonacci Series) or write your own program in the language.
   3.  **Save the file.**
   4.  **Run `demo.js`:** In your terminal, navigate to the project directory and execute the following command:

       ```bash
       node demo.js
       ```

#### 2.  Providing Code as a Command-Line Argument

   Alternatively, you can provide the program's code directly as a string argument when running `demo.js` from the command line.

   1.  **Open your terminal.**
   2.  **Navigate to the project directory.**
   3.  **Execute `demo.js` with the code as an argument:**

       ```bash
       node demo.js "<your_program_code_here>"
       ```

       **Important:** Ensure that your program code is enclosed in double quotes (`"`) to be treated as a single argument. You might need to escape special characters within the code string as required by your shell.

### Example

To run the Quick Sort example by modifying the `DEFAULT_ARG` variable:

1.  Navigate to the `demo` folder.
2.  Set `DEFAULT_ARG` to the Quick Sort code.
3.  Save `demo.js`.
4.  Run `node demo.js` in the terminal.

The output of the Quick Sort program will be displayed in the terminal.
