// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { formula, init } from "expressionparser";
import { DataType, ENV_CHARACTER, IGNORE_CHARACTER, KeyValue, Parameter, ParameterContainer } from "../../interface";

/**
 * The worker which helps parsing parameter variables into argument\
 * Including expression executing
 */
export class Util_Parser {

    paras:Array<KeyValue> = []
    public get count() : number {
        return this.paras.length
    }

    constructor(_paras:Array<KeyValue>){
        this.paras = _paras
    }

    clone = () => {
        const b:Array<KeyValue> = JSON.parse(JSON.stringify(this.paras))
        return new Util_Parser(b)
    }

    /**
     * Turn parameter into a list of keyvalue structure\
     * Exclude the expression datatype
     * @param p Target parameter instance
     * @returns The list of keyvalue
     */
    static to_keyvalue = (p:Parameter):Array<KeyValue> => {
        return [
            ...this._to_keyvalue(p.containers)
        ]
    }

    /**
     * Input a object data, and deep search all of subobject\
     * Phrasing it into keyvalue data
     * @param obj Object
     * @returns Array of keyvalue data
     */
    private static getDeepKeys = (obj:any, name?:string):Array<[string, any]> => {
        let keys:Array<[string, any]> = []
        for(var key in obj) {
            keys.push([name ? name + "." + key : key, obj[key]]);
            if(typeof obj[key] === "object") {
                if(Array.isArray(obj[key])) {
                    if(typeof obj[key]['length'] === 'number'){
                        keys.push([name ? name + "." + key + ".length" : key + ".length", obj[key]['length']]);
                    }
                }
                var subkeys = this.getDeepKeys(obj[key]);
                keys = keys.concat(subkeys.map(function(subkey) {
                    return [name ? name + "." + key + "." + subkey[0] : key + "." + subkey[0], subkey[1]];
                }));
            }
        }
        return keys
    }

    /**
     * Parameter containers into keyvalue list
     */
    static _to_keyvalue = (p:Array<ParameterContainer>):Array<KeyValue> => {
        const r:Array<KeyValue> = []
        r.push(...p.filter(x => x.type == DataType.Boolean || x.type == DataType.String || x.type == DataType.Textarea || x.type == DataType.Number || x.type == DataType.Expression).map(x => { return { key: x.name, value: x.value.toString() } }))
        const objs = p.filter(x => x.type == DataType.Object)
        const lists = p.filter(x => x.type == DataType.List)
        const selects = p.filter(x => x.type == DataType.Select)
        for(const obj of objs){
            const v = obj.value
            const keys = this.getDeepKeys(v, obj.name)
            r.push(...keys.map(x => { return { key: x[0], value: x[1].toString() } }))
        }
        for(const list of lists){
            const a:Array<any> = list.value
            r.push(...a.map((x, index) => { return { key: list.name + "." + String(index), value: x } }))
            r.push({ key: list.name + ".length", value: a.length })
        }
        for(const select of selects){
            const a:Array<any> = select.meta
            const target = a[select.value]
            r.push({ key: select.name, value: target })
        }
        return r
    }

    /**
     * Search all the string result and replace to target string\
     * @example 
     * replaceAll("ABCBCAB", "AB", "KK") // Result: KKCBCKK
     * @param str string data
     * @param fi feature
     * @param tar replace target
     */
    static replaceAll = (str:string, fi:string, tar:string):string => {
        let p = str
        while(p.includes(fi)) p = p.replace(fi, tar)
        return p
    }
    
    /**
     * Replace a string to environment string\
     * * Include Expression calculation
     * * Include Env string, boolean, number replacing
     * @param text Input text
     * @param paras The keyvalue list
     * @returns The result string
     */
    replacePara = (text:string):string => {
        let buffer = ''
        let store = ''
        let state:boolean = false
        let ignore:number = -1
        let useExp = false
        for(const v of text){
            if(v == IGNORE_CHARACTER && ignore == -1) ignore = 0
            else if(ignore == 0) ignore = 1
            else if(ignore == 1) ignore = 2
            else if(ignore == 2) ignore = -1
            if(v == ENV_CHARACTER && ignore == -1){
                state = !state
                if(!state) { // End
                    if(useExp){
                        buffer += this.parse(store)
                    }else{
                        buffer += this._replacePara(store)
                    }
                    store = ""
                    useExp = false
                }
            }
            if(v == '{' && state && store.length == 0) useExp = true
            if(state && v != ENV_CHARACTER && (ignore != 0)) store += v
            if(!state && v != ENV_CHARACTER && (ignore != 0)) buffer += (ignore > 0 ? (ENV_CHARACTER + v) : v)
        }
        return buffer
    }

    /**
     * Expression magic
     * @param str Input string, the expression part of string only, not the entire sentence
     * @param paras Keyvalue list
     * @returns Result calculation
     */
    parse = (str:string):string => {
        str = str.substring(1, str.length - 1)
        const parser = init(formula, (term: string) => {
            if(term.includes("_ck_")){
                const index = this.paras.findIndex(x => x.key == "ck")
                if(index != -1) term = Util_Parser.replaceAll(term, "_ck_", this.paras[index].value)
            }
            const index = this.paras.findIndex(x => x.key == term)
            if(index != -1) {
                const n = Number(this.paras[index].value)
                if(Number.isNaN(n)) return this.paras[index].value
                return n
            }
            else return 0
        });
        const r = parser.expressionToValue(str).toString()
        return r
    }

    private _replacePara = (store:string) => {
        const index = this.paras.findIndex(x => x.key == store)
        if(index == -1) return `%${store}%`
        return this.paras[index].value
    }
}