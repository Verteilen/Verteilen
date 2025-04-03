import { DataType, Parameter } from '../../src/share/interface';
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
        p = { canWrite: true, containers: [
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
        p = { canWrite: true, containers: [
            { name: 'n1', value: 0, type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 's1', value: "Test", type: DataType.Number, hidden: false, runtimeOnly: false },
            { name: 'b1', value: true, type: DataType.Number, hidden: false, runtimeOnly: false },
        ]}
        e = new Util_Parser(Util_Parser.to_keyvalue(p))
    })
    afterAll(() => {
        p = undefined
        e = undefined
    })
    test("Number replace", () => {
        expect(e!.replacePara("%n1% Hello")).toBe("0 Hello")
    })
    test("String replace", () => {
        expect(e!.replacePara("%s1% Hello")).toBe("Test Hello")
    })
    test("Boolean replace", () => {
        expect(e!.replacePara("%b1% Hello")).toBe("true Hello")
    })
})