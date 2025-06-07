import { ClientJobParameter } from '../../src/share/client/job_parameter';
import { ClientJavascript } from '../../src/share/client/javascript';
import { ClientOS } from '../../src/share/client/os';
import { DataType, Job, Libraries, Parameter } from '../../src/share/interface';


describe("JS Test", () => {
    let js:ClientJavascript | undefined = undefined
    let job:Job | undefined = undefined
    let os:ClientOS | undefined = undefined
    let para:ClientJobParameter | undefined = undefined
    let parameter:Parameter | undefined = undefined
    let lib:Libraries | undefined = undefined
    beforeAll(() => {
        os = new ClientOS(() => "", () => "", (str) => console.log(str), (str) => console.log(str))
        para = new ClientJobParameter()
        parameter = {
            uuid: "",
            title: "",
            canWrite: true,
            containers: [
                { name: "n1", type: DataType.Number, value: 7, hidden: false, runtimeOnly: false },
                { name: "n2", type: DataType.Number, value: 5, hidden: false, runtimeOnly: false },
                { name: "s1", type: DataType.String, value: "Hello World", hidden: false, runtimeOnly: false },
                { name: "b1", type: DataType.Boolean, value: true, hidden: false, runtimeOnly: false },
                { name: "e1", type: DataType.Expression, value: 0, meta: "n1 + n2", hidden: false, runtimeOnly: false },
            ]
        }
        js = new ClientJavascript(
            (str) => console.log(str), 
            (str) => console.log(str), 
            () => job)
        ClientJavascript.Init(
            (str) => console.log(str), 
            (str) => console.log(str),
            os,
            para,
            () => lib,
            () => parameter,
            () => job
        )
    })
    afterAll(() => {
        js = undefined
    })
    test("Env test getter", () => {
        expect(js!.JavascriptExecuteWithLib(`result = env.getnumber("n1")`, [])).toBe(7)
        expect(js!.JavascriptExecuteWithLib(`result = env.getnumber("n2")`, [])).toBe(5)
        expect(js!.JavascriptExecuteWithLib(`result = env.getstring("s1")`, [])).toBe("Hello World")
        expect(js!.JavascriptExecuteWithLib(`result = env.getboolean("b1")`, [])).toBe(true)
        expect(js!.JavascriptExecuteWithLib(`result = env.getnumber("nnn")`, [])).toBe(0)
        expect(js!.JavascriptExecuteWithLib(`result = env.getstring("sss")`, [])).toBe("")
        expect(js!.JavascriptExecuteWithLib(`result = env.getboolean("bbb")`, [])).toBe(false)
    })
    test("Env test has", () => {
        expect(js!.JavascriptExecuteWithLib(`result = env.hasnumber("n1")`, [])).toBe(true)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasnumber("n2")`, [])).toBe(true)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasstring("s1")`, [])).toBe(true)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasboolean("b1")`, [])).toBe(true)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasnumber("nnn")`, [])).toBe(false)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasstring("sss")`, [])).toBe(false)
        expect(js!.JavascriptExecuteWithLib(`result = env.hasboolean("bbb")`, [])).toBe(false)
    })
})