import { messager_log } from "../debugger"
import { Project, Setter } from "../interface"

let current:Project | undefined = undefined

export const ExecuteProject = (project:Project) => {
    current = project
}

export const feedback_string = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.strings.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.strings[index].value = data.value
    messager_log(`[字串參數回饋] ${data.key} = ${data.value}`)
}

export const feedback_number = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.numbers.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.numbers[index].value = data.value
    messager_log(`[數字參數回饋] ${data.key} = ${data.value}`)
}

export const feedback_boolean = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.booleans.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.booleans[index].value = data.value
    messager_log(`[布林參數回饋] ${data.key} = ${data.value}`)
}