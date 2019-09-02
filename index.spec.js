
const {default:compile} = require("./index.js")

const testString  = " A && B || C || D"
const testString2 = " CSO && ( 12331 || 12332 ) ";
const testString3 = " !CSO && ( 12331 || 12332 ) ";

const func1 = compile(testString)
const func2 = compile(testString2)
const func3 = compile(testString3)
const func4 = compile("A&&C||D&&E && !B")
const func5 = compile("\"A C\"||\"D E\"&&\"N G\"")

function test(func,s,r){
    console.assert(func(s)===r,s+" Failed")
}

try{

    test(func1,"A",false)
    test(func1,"A caefc B",true)
    test(func1,"AB",true)
    test(func1,"CA",true)
    test(func1,"AcwefaC",true)
    test(func2,"CSO caef12331",true)
    test(func2,"cawe CSOcawef12332",true)
    test(func3,"12331",true)
    test(func3,"12332",true)
    test(func3,"1233212332",true)
    test(func3,"CSO12331",false)
    test(func3,"CSO12332",false)

    test(func4,"AC",true)
    test(func4,"DE",true)
    test(func4,"DEB",false)
    test(func5,"A Cast",true)
    test(func5,"ACast",false)
    test(func5,"A C",true)
    test(func5,"D EjcoaeijfN G",true)
    test(func5,"D EjcoaeijfN ",false)

    let err = null
    try{
        compile("(haha")
    }catch(e){
        err = e
    }
    console.assert(err!==null && err.message.includes("Invalid Syntax"))

}catch(e){

}