import { formula, init } from "expressionparser";
import { DataType, ENV_CHARACTER, KeyValue, Parameter, ParameterContainer } from "../../interface";

export class Util_Parser {

    paras:Array<KeyValue> = []
    public get count() : number {
        return this.paras.length
    }

    constructor(_paras:Array<KeyValue>){
        this.paras = _paras
    }

    /**
     * Turn parameter into a list of keyvalue structure\
     * Exclude the expression datatype
     * @param p Target parameter instance
     * @returns The list of keyvalue
     */
    static to_keyvalue = (p:Parameter):Array<KeyValue> => {
        return [
            ...this._to_keyvalue(p.containers.filter(x => x.type != DataType.Expression))
        ]
    }

    static _to_keyvalue = (p:Array<ParameterContainer>):Array<KeyValue> => {
        return p.map(x => { return { key: x.name, value: x.value.toString() } })
    }

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
        let useExp = false
        for(const v of text){
            if(v == ENV_CHARACTER){
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
            if(state && v != ENV_CHARACTER) store += v
            if(!state && v != ENV_CHARACTER) buffer += v
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
            if(index != -1) return Number(this.paras[index].value)
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