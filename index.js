"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Identifier = /** @class */ (function () {
    function Identifier(name) {
        this.name = name;
    }
    Identifier.prototype.toString = function () {
        return this.name;
    };
    Identifier.prototype.eval = function (context) {
        return context.root.includes(this.name);
    };
    return Identifier;
}());
var Func = /** @class */ (function () {
    function Func(name, argNum, isRightAssociative, precedence) {
        this.name = name;
        this.argNum = argNum;
        this.isRightAssociative = isRightAssociative;
        this.precedence = precedence;
    }
    Func.prototype.toString = function () {
        return this.name;
    };
    return Func;
}());
var And = /** @class */ (function (_super) {
    __extends(And, _super);
    function And() {
        return _super.call(this, "AND", 2, false, 2) || this;
    }
    And.prototype.eval = function (context, args) {
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            if (!arg.value.eval(context, arg.children)) {
                return false;
            }
        }
        return true;
    };
    return And;
}(Func));
var Or = /** @class */ (function (_super) {
    __extends(Or, _super);
    function Or() {
        return _super.call(this, "OR", 2, false, 1) || this;
    }
    Or.prototype.eval = function (context, args) {
        for (var _i = 0, args_2 = args; _i < args_2.length; _i++) {
            var arg = args_2[_i];
            if (arg.value.eval(context, arg.children)) {
                return true;
            }
        }
        return false;
    };
    return Or;
}(Func));
var Not = /** @class */ (function (_super) {
    __extends(Not, _super);
    function Not() {
        return _super.call(this, "Not", 1, false, 3) || this;
    }
    Not.prototype.eval = function (context, args) {
        return !args[0].value.eval(context, args[0].children);
    };
    return Not;
}(Func));
var LeftParen = /** @class */ (function () {
    function LeftParen() {
    }
    LeftParen.prototype.toString = function () {
        return '(';
    };
    return LeftParen;
}());
var RightParen = /** @class */ (function () {
    function RightParen() {
    }
    RightParen.prototype.toString = function () {
        return ')';
    };
    return RightParen;
}());
var AST = /** @class */ (function () {
    function AST(value, children) {
        this.value = value;
        this.children = children;
    }
    return AST;
}());
function tokenize(str) {
    var outputAST = [];
    var operatorStack = [];
    var i = 0;
    function makeSyntaxError(i) {
        return new SyntaxError("Syntax Error at column " + i + ": " + str.slice(Math.max(0, i - 5), i) + " >>>" + str[i] + "<<<");
    }
    var quoted = false;
    while (i < str.length) {
        switch (str[i]) {
            case "(": {
                readToken(new LeftParen());
                i++;
                break;
            }
            case ")": {
                readToken(new RightParen());
                i++;
                break;
            }
            case "&": {
                if (i < str.length - 1 && str[i + 1] === "&") {
                    readToken(new And());
                }
                else {
                    throw makeSyntaxError(i);
                }
                i += 2;
                break;
            }
            case "|": {
                if (i < str.length - 1 && str[i + 1] === "|") {
                    readToken(new Or());
                }
                else {
                    throw makeSyntaxError(i);
                }
                i += 2;
                break;
            }
            case "!": {
                readToken(new Not());
                i++;
                break;
            }
            case " ": {
                i++;
                break;
            }
            case "\"": {
                quoted = true;
                i++;
                break;
            }
            default: {
                var tokenStart = i;
                while (i < str.length && (quoted ? str[i] !== "\"" : !["!", " ", "&", "|", "(", ")"].includes(str[i]))) {
                    i++;
                }
                var token = str.slice(tokenStart, i);
                quoted = false;
                if (quoted) {
                    i++;
                }
                readToken(new Identifier(token));
                break;
            }
        }
    }
    function readToken(token) {
        if (token instanceof Identifier) {
            outputAST.push(new AST(token));
            checkUnary();
        }
        else if (token instanceof Func) {
            // while ((there is a function at the top of the operator stack)
            //         or (there is an operator at the top of the operator stack with greater precedence)
            //         or (the operator at the top of the operator stack has equal precedence and is left associative))
            //     and (the operator at the top of the operator stack is not a left parenthesis):
            //     pop operators from the operator stack onto the output queue.
            // push it onto the operator stack.
            var topOpStack = operatorStack[operatorStack.length - 1];
            while (topOpStack &&
                topOpStack instanceof Func &&
                (topOpStack.isRightAssociative && topOpStack.precedence === token.precedence ||
                    topOpStack.precedence > token.precedence)) {
                makeAstNode();
                topOpStack = operatorStack[operatorStack.length - 1];
            }
            operatorStack.push(token);
        }
        else if (token instanceof LeftParen) {
            operatorStack.push(token);
        }
        else if (token instanceof RightParen) {
            var topOpStack = operatorStack[operatorStack.length - 1];
            while (topOpStack && !(topOpStack instanceof LeftParen)) {
                makeAstNode();
                topOpStack = operatorStack[operatorStack.length - 1];
            }
            operatorStack.pop(); //pop left paren
            checkUnary();
        }
    }
    function checkUnary() {
        if (operatorStack.length > 0) {
            var topOpStack = operatorStack[operatorStack.length - 1];
            if (topOpStack instanceof Func && topOpStack.argNum === 1) {
                makeAstNode();
            }
        }
    }
    function makeAstNode() {
        if (operatorStack.length > 0) {
            var func = operatorStack[operatorStack.length - 1];
            if (func instanceof Func) {
                operatorStack.length--;
                var args = emptyArray;
                if (func.argNum > 0) {
                    args = outputAST.slice(-func.argNum);
                    outputAST = outputAST.slice(0, -func.argNum);
                    outputAST.push(new AST(func, args));
                }
                else {
                    outputAST.push(new AST(func, []));
                }
                return true;
            }
            return false;
        }
        return false;
    }
    while (operatorStack.length > 0) {
        var successful = makeAstNode();
        if (!successful) {
            throw new Error("Invalid Syntax");
        }
    }
    if (outputAST.length > 1) {
        throw new Error("Invalid Syntax");
    }
    return outputAST[0] || null;
}
var emptyArray = [];
function compile(str) {
    var ast = tokenize(str);
    return function match(target) {
        var context = {
            root: target,
            symbols: {}
        };
        return !ast ? true : ast.value.eval(context, ast.children);
    };
}
exports.default = compile;
function printAST(ast, level) {
    if (level === void 0) { level = 0; }
    if (!ast) {
        console.log("NULL");
    }
    else {
        console.log("\t".repeat(level) + ast.value.name);
        ast.children && ast.children.map(function (v) { return printAST(v, level + 1); });
    }
}
exports.printAST = printAST;
//# sourceMappingURL=index.js.map