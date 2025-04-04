import { ClientJobParameter } from '../../src/share/client/job_parameter';
import { ClientLua } from '../../src/share/client/lua';
import { ClientOS } from '../../src/share/client/os';
import { DataType, Job, Libraries, Parameter } from '../../src/share/interface';


describe("Lua Test", () => {
    let lua:ClientLua | undefined = undefined
    let job:Job | undefined = undefined
    let os:ClientOS | undefined = undefined
    let para:ClientJobParameter | undefined = undefined
    let parameter:Parameter | undefined = undefined
    let lib:Libraries | undefined = undefined
    beforeAll(() => {
        os = new ClientOS(() => "", () => "", (str) => console.log(str), (str) => console.log(str))
        para = new ClientJobParameter()
        parameter = {
            canWrite: true,
            containers: [
                { name: "n1", type: DataType.Number, value: 7, hidden: false, runtimeOnly: false },
                { name: "s1", type: DataType.String, value: "Hello World", hidden: false, runtimeOnly: false },
                { name: "b1", type: DataType.Boolean, value: true, hidden: false, runtimeOnly: false },
            ]
        }
        lua = new ClientLua(
            (str) => console.log(str), 
            (str) => console.log(str), 
            () => job)
        ClientLua.Init(
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
        lua = undefined
    })
    test("Env test getter", () => {
        expect(lua!.LuaExecuteWithLib(`return env.getnumber("n1")`, [])).toBe(7)
        expect(lua!.LuaExecuteWithLib(`return env.getstring("s1")`, [])).toBe("Hello World")
        expect(lua!.LuaExecuteWithLib(`return env.getboolean("b1")`, [])).toBe(true)
        expect(lua!.LuaExecuteWithLib(`return env.getnumber("nnn")`, [])).toBe(0)
        expect(lua!.LuaExecuteWithLib(`return env.getstring("sss")`, [])).toBe("")
        expect(lua!.LuaExecuteWithLib(`return env.getboolean("bbb")`, [])).toBe(false)
    })
    test("Env test has", () => {
        expect(lua!.LuaExecuteWithLib(`return env.hasnumber("n1")`, [])).toBe(true)
        expect(lua!.LuaExecuteWithLib(`return env.hasstring("s1")`, [])).toBe(true)
        expect(lua!.LuaExecuteWithLib(`return env.hasboolean("b1")`, [])).toBe(true)
        expect(lua!.LuaExecuteWithLib(`return env.hasnumber("nnn")`, [])).toBe(false)
        expect(lua!.LuaExecuteWithLib(`return env.hasstring("sss")`, [])).toBe(false)
        expect(lua!.LuaExecuteWithLib(`return env.hasboolean("bbb")`, [])).toBe(false)
    })
})