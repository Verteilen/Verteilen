import * as vm from 'vm'

const safeEval = (code:string, context?:any, opts?:vm.RunningCodeInNewContextOptions | string) => {
    let sandbox = {}
    let resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000)
    sandbox[resultKey] = {}
    var clearContext = `
        (function(){
            Function = undefined;
            const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
            keys.forEach((key) => {
            const item = this[key];
            if(!item || typeof item.constructor !== 'function') return;
            this[key].constructor = undefined;
            });
        })();
    `
    code = clearContext + resultKey + '=' + code
    if (context != undefined) {
        Object.keys(context).forEach(function (key) {
            sandbox[key] = context[key]
        })
    }
    vm.runInNewContext(code, sandbox, opts)
    return sandbox[resultKey]
}

export class ClientJavascript {
    JavascriptExecute = (javascript:string) => {
        const r = safeEval(javascript)
        return r
    }
}