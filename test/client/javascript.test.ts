import { ClientJobParameter } from '../../src/share/client/job_parameter';
import { ClientJavascript } from '../../src/share/client/javascript';
import { ClientOS } from '../../src/share/client/os';
import { DataType, Job, JobCategory, JobType, Libraries, Parameter, Task } from '../../src/share/interface';


describe("JS Test", () => {
    let js:ClientJavascript | undefined = undefined
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
            () => undefined)
        ClientJavascript.Init(
            (str) => console.log(str), 
            (str) => console.log(str),
            os!,
            para!,
            () => lib,
            () => parameter,
            () => undefined
        )
    })
    afterAll(() => {
        js = undefined
        os = undefined
        para = undefined
        parameter = undefined
        lib = undefined
    })
    test("Env test getter", async () => {
        expect(await js!.JavascriptExecuteWithLib(`return env.getnumber("n1");`, [])).toBe(7)
        expect(await js!.JavascriptExecuteWithLib(`return env.getnumber("n2");`, [])).toBe(5)
        expect(await js!.JavascriptExecuteWithLib(`return env.getstring("s1");`, [])).toBe("Hello World")
        expect(await js!.JavascriptExecuteWithLib(`return env.getboolean("b1");`, [])).toBe(true)
        expect(await js!.JavascriptExecuteWithLib(`return env.getnumber("nnn");`, [])).toBe(undefined)
        expect(await js!.JavascriptExecuteWithLib(`return env.getstring("sss");`, [])).toBe(undefined)
        expect(await js!.JavascriptExecuteWithLib(`return env.getboolean("bbb");`, [])).toBe(undefined)
    })
    test("Env test loop", async () => {
        expect(await js!.JavascriptExecuteWithLib(`
        result = 0;
        n = env.getnumber("n2");
        for(i=0;i<3;i++){
            result += n;
        }
        return result;
        `, [])).toBe(15)
    })
    test("Env test has", async () => {
        expect(await js!.JavascriptExecuteWithLib(`return env.hasnumber("n1");`, [])).toBe(true)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasnumber("n2");`, [])).toBe(true)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasstring("s1");`, [])).toBe(true)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasboolean("b1");`, [])).toBe(true)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasnumber("nnn");`, [])).toBe(false)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasstring("sss");`, [])).toBe(false)
        expect(await js!.JavascriptExecuteWithLib(`return env.hasboolean("bbb");`, [])).toBe(false)
    })
})