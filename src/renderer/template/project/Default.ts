import { v6 as uuidv6 } from 'uuid';
import { ConditionResult, DataType, Job, JobCategory, JobType, JobType2, Parameter, Project, Task } from "../../interface";
import { DEFAULT_LuaExample } from '../lua/Default';

const GetDefaultProjectTemplate_Lua = ():Task => {
    const lua:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: DEFAULT_LuaExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "運行 Lua",
        description: "",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            lua
        ]
    }
    return t
}

const GetDefaultProjectTemplate_Pnumber2 = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["", "echo", "%prop%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "輸出數字 運算式",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: "prop",
                expression: "ck * 5"
            }
        ],
        jobs: [
            checker
        ]
    }
    return t
}

const GetDefaultProjectTemplate_Pnumber = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["", "echo", "%ck%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "輸出數字",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            checker
        ]
    }
    return t
}

const GetDefaultProjectTemplate_Checker = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Condition,
        type: JobType2.CHECK_PATH,
        lua: "",
        string_args: ["%path%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "檢測路徑",
        description: "",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            checker
        ]
    }
    return t
}

export const GetDefaultProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        canWrite: true,
        containers: [
            { name: "n1", value: 120, type: DataType.Number, runtimeOnly: false, hidden: false },

            { name: "path", value: "C:\\Tool", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "s1", value: "Hello World", type: DataType.String, runtimeOnly: false, hidden: false },

            { name: "b1", value: false, type: DataType.Boolean, runtimeOnly: false, hidden: false }
        ]
    }
    r.parameter = para
    r.task = [
        GetDefaultProjectTemplate_Checker(),
        GetDefaultProjectTemplate_Pnumber(),
        GetDefaultProjectTemplate_Pnumber2(),
        GetDefaultProjectTemplate_Lua(),
    ]
    return r
}