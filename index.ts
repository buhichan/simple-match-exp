

type Context = {
    root:string,
    symbols:Record<string,any>
}

class Identifier {
    constructor(
        public name:string,
    ){}
    toString(){
        return this.name
    }
    eval(context:Context){
        return context.root.includes(this.name)
    }
}

abstract class Func {
    constructor(
        public name:string,
        public argNum:number,
        public isRightAssociative:boolean,
        public precedence: number,
    ){}
    toString(){
        return this.name
    }
    abstract eval(context:Context,children?:AST[]):boolean
}

class And extends Func{
    constructor(){
        super("AND",2,false,2)
    }
    eval(context:Context,args:AST[]){
        for(let arg of args){
            if(!arg.value.eval(context,arg.children)){
                return false
            }
        }
        return true
    }
}

class Or extends Func{
    constructor(){
        super("OR",2,false,1)
    }
    eval(context:Context,args:AST[]){
        for(let arg of args){
            if(arg.value.eval(context,arg.children)){
                return true
            }
        }
        return false
    }
}

class Not extends Func{
    constructor(){
        super("Not",1,false,3)
    }
    eval(context:Context,args:AST[]){
        return !args[0].value.eval(context,args[0].children)
    }
}

class LeftParen {
    toString(){
        return '('
    }
}

class RightParen {
    toString(){
        return ')'
    }
}

class AST{
    constructor(
        public value:EvaluableToken,
        public children?:AST[],
    ){}
}

type Token = Func | Identifier | LeftParen | RightParen

type EvaluableToken = Func | Identifier

function tokenize(str:string){
    let outputAST:AST[] = []
    let operatorStack:(Func|LeftParen)[] = []
    let i=0

    function makeSyntaxError(i:number){
        return new SyntaxError(`Syntax Error at column ${i}: ${str.slice(Math.max(0,i-5),i)} >>>${str[i]}<<<`)
    }

    let quoted = false;
    
    while(i<str.length){

        switch(str[i]){
            case "(":{
                readToken(new LeftParen())
                break;
            }
            case ")":{
                readToken(new RightParen())
                break;
            }
            case "&":{
                if(i < str.length - 1 && str[i+1]==="&" ){
                    readToken(new And())
                    i++
                }else{
                    throw makeSyntaxError(i)
                }
                break;
            }
            case "|":{
                if(i < str.length - 1 && str[i+1]==="|"){
                    readToken(new Or())
                    i++
                }else{
                    throw makeSyntaxError(i)
                }
                break;
            }
            case "!":{
                readToken(new Not())
            }
            case " ":{
                break;
            }
            case "\"":{
                quoted = true
                break;
            }
            default:{
                let tokenStart = i
                while(i < str.length && (quoted ? str[i] !== "\""  : !["!"," ","&","|","(",")"].includes(str[i]) )){
                    i++
                }
                const token = str.slice(tokenStart, i)
                quoted = false
                if(quoted){
                    i++
                }
                readToken(new Identifier(token))
                i--
            }
        }
        i++;
    }

    function readToken(token:Token){
        if(token instanceof Identifier){
            outputAST.push(new AST(token))
            checkUnary()
        }else if(token instanceof Func){
            // while ((there is a function at the top of the operator stack)
            //         or (there is an operator at the top of the operator stack with greater precedence)
            //         or (the operator at the top of the operator stack has equal precedence and is left associative))
            //     and (the operator at the top of the operator stack is not a left parenthesis):
            //     pop operators from the operator stack onto the output queue.
            // push it onto the operator stack.
            let topOpStack = operatorStack[operatorStack.length-1];
            while(
                topOpStack && 
                topOpStack instanceof Func && 
                (
                    topOpStack.isRightAssociative && topOpStack.precedence === token.precedence || 
                    topOpStack.precedence > token.precedence
                )
            ){
                makeAstNode()
                topOpStack = operatorStack[operatorStack.length-1]
            }
            operatorStack.push(token)
        }else if(token instanceof LeftParen){
            operatorStack.push(token)
        }else if(token instanceof RightParen){
            let topOpStack = operatorStack[operatorStack.length-1];
            while(topOpStack && !(topOpStack instanceof LeftParen)){
                makeAstNode()
                topOpStack = operatorStack[operatorStack.length-1]
            }
            operatorStack.pop() //pop left paren
            checkUnary()
        }
    }

    function checkUnary(){
        if(operatorStack.length > 0){
            let topOpStack = operatorStack[operatorStack.length-1];
            if(topOpStack instanceof Func && topOpStack.argNum === 1){
                makeAstNode()
            }
        }
    }

    function makeAstNode(){
        if(operatorStack.length > 0){
            let func = operatorStack[operatorStack.length-1];
            if(func instanceof Func){
                operatorStack.length--
                let args = emptyArray as AST[]
                if(func.argNum > 0){
                    args = outputAST.slice(-func.argNum)
                    outputAST = outputAST.slice(0, -func.argNum)
                    outputAST.push(new AST(func,args))
                }else{
                    outputAST.push(new AST(func,[]))
                }
            }
        }
    }

    while(operatorStack.length > 0){
        makeAstNode()
    }

    if(outputAST.length > 1){
        throw new Error("Invalid Syntax")
    }

    return outputAST[0] || null
}

const emptyArray:any[] = []

export default function compile(str:string){

    const ast = tokenize(str)

    return function match(target:string){
        const context:Context={
            root:target,
            symbols:{}
        }
        return !ast ? true : ast.value.eval(context,ast.children)
    }
}

export function printAST(ast:AST|null,level=0){
    if(!ast){
        console.log("NULL")
    }else{
        console.log("\t".repeat(level)+ast.value.name)
        ast.children && ast.children.map(v=>printAST(v,level+1))
    }
}