
const {default:compile} = require("./index.js")

const func1 = compile(" A && B || C || D")
const func2 = compile(" CSO && ( 12331 || 12332 ) ")
const func3 = compile(" !CSO && ( 12331 || 12332 ) ")
const func4 = compile("A&&C||D&&E && !B")
const func5 = compile("\"A C\"||\"D E\"&&\"N G\"")
const func6 = compile("\"haha\\\"haha\\\\haha\"")

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

    test(func6,"haha\"haha\\haha", true)

    let err = null
    try{
        compile("(haha")
    }catch(e){
        err = e
    }
    console.assert(err!==null && err.message.includes("Invalid Syntax"))

}catch(e){

}