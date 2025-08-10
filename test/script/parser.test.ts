import { DataType, DataTypeBase, Parameter } from '../../src/share/interface';
import { Util_Parser } from '../../src/share/script/execute/util_parser';

describe('Parser testing (Replace Text Feature)', () => {
    test("Single replace", () => {
        expect(Util_Parser.replaceAll('E %YYY% KK', '%YYY%', '6')).toBe('E 6 KK');
    })
    test("Multiple replace", () => {
        expect(Util_Parser.replaceAll('E %YYY% KK %YYY%', '%YYY%', '6')).toBe('E 6 KK 6');
    })
});

describe('Parser testing (ToKeyValue)', () => {
    let p:Parameter | undefined = undefined
    beforeAll(() => {
        p = { uuid: '', title: '', canWrite: true, containers: [
            { name: 'n1', value: 0, type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 's1', value: "Test", type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 'b1', value: true, type: DataType.Number, hidden: false, runtimeOnly: false },
        ]}
    })
    afterAll(() => {
        p = undefined
    })
    test("Testing value transform", () => {
        const a = Util_Parser.to_keyvalue(p!)
        expect(a.length).toBe(3)
        expect(a[0].key).toBe("n1")
        expect(a[0].value).toBe("0")
        expect(a[1].key).toBe("s1")
        expect(a[1].value).toBe("Test")
        expect(a[2].key).toBe("b1")
        expect(a[2].value).toBe("true")
    })
})

describe('Parser testing (replacePara)', () => {
    let p:Parameter | undefined = undefined
    let e:Util_Parser | undefined = undefined
    beforeAll(() => {
        p = { uuid: '', title: '', canWrite: true, containers: [
            { name: 'n1', value: 7, type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 'n2', value: 9, type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 's1', value: "Test", type: DataType.String, hidden: false, runtimeOnly: false },
            { name: 'b1', value: true, type: DataType.Boolean, hidden: false, runtimeOnly: false },
            { name: 'o1', value: { 
                t: "Test", t2: "Hello",
                deep: { d: "World" },
                data: [ { iframe: 5, p: 5, n: 5 }, { iframe: 10, p: 5, n: 5 } ]
            }, type: DataType.Object, hidden: false, runtimeOnly: false },
            { name: 'Se1', value: 0, meta: [123456], config: { types: [DataTypeBase.Number] }, type: DataType.Select, hidden: false, runtimeOnly: false },
            { name: 'Li1', value: ["Hello", "World"], type: DataType.List, hidden: false, runtimeOnly: false },
        ]}
        e = new Util_Parser([...Util_Parser.to_keyvalue(p), { key: 'ck', value: 1 }])
    })
    afterAll(() => {
        p = undefined
        e = undefined
    })
    test("Number replace", () => {
        expect(e!.replacePara("%n1% Hello")).toBe("7 Hello")
    })
    test("String replace", () => {
        expect(e!.replacePara("%s1% Hello")).toBe("Test Hello")
        expect(e!.replacePara("%s1%/%s1%/Hello")).toBe("Test/Test/Hello")
    })
    test("Boolean replace", () => {
        expect(e!.replacePara("%b1% Hello")).toBe("true Hello")
    })
    test("Expression replace", () => {
        expect(e!.replacePara("%{ n1 * n2 }% Hello")).toBe("63 Hello")
    })
    test("Expression replace include index", () => {
        expect(e!.replacePara("%{ n_ck_ * n2 }% Hello")).toBe("63 Hello")
    })
    test("Prevent Failed Expression replace", () => {
        expect(e!.replacePara("%{ n1 * OK }% Hello")).toBe("0 Hello")
    })
    test("Prevent replace", () => {
        expect(e!.replacePara("%OK% Hello")).toBe("%OK% Hello")
    })
    test("Object replace", () => {
        expect(e!.replacePara("%o1.t%")).toBe("Test")
        expect(e!.replacePara("%o1.t2%")).toBe("Hello")
        expect(e!.replacePara("%o1.deep.d%")).toBe("World")
        expect(e!.replacePara("%o1.data.length%")).toBe("2")
        expect(e!.replacePara("%o1.data.length%")).toBe("2")
        expect(e!.replacePara("%o1.data.length%")).toBe("2")
        expect(e!.replacePara("%o1.data.0.iframe%")).toBe("5")
        expect(e!.replacePara("%o1.data.1.iframe%")).toBe("10")
    })
    test("List replace one", () => {
        expect(e!.replacePara("Hello %Li1.1%")).toBe("Hello World")
    })
    test("List replace both", () => {
        expect(e!.replacePara("%Li1.0% %Li1.1%")).toBe("Hello World")
    })
    test("List Length replace", () => {
        expect(e!.replacePara("D%Li1.length%")).toBe("D2")
    })
    test("List Length replace", () => {
        expect(e!.replacePara("D%Li1.length%")).toBe("D2")
    })
    test("Select replace", () => {
        expect(e!.replacePara("D%Se1%")).toBe("D123456")
    })
    test("Ignore", () => {
        expect(e!.replacePara("^%05d.png")).toBe("%05d.png")
    })
})