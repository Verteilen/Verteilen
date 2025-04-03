import { Util_Parser } from '../../src/share/script/execute/util_parser';

describe('Parser testing', () => {
    test("Replace all text testing, single replace", () => {
        expect(Util_Parser.replaceAll('E %YYY% KK', '%YYY%', '6')).toBe('E 6 KK');
    })
    test("Replace all text testing, multiple replace", () => {
        expect(Util_Parser.replaceAll('E %YYY% KK %YYY%', '%YYY%', '6')).toBe('E 6 KK 6');
    })
});