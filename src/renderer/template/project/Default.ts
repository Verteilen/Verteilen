import { v6 as uuidv6 } from 'uuid';
import { ConditionResult, DataType, Job, JobCategory, JobType, JobType2, Parameter, Project, Task } from "../../interface";
import { DEFAULT_LuaCronMultiExample, DEFAULT_LuaExample, DEFAULT_LuaPrintExample, DEFAULT_LuaSaveExample } from '../lua/Default';

const GetDefaultProjectTemplate_PrintCustomParameterMulticore = ():Task => {
    const lua:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: DEFAULT_LuaPrintExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print save custom parameters with multicore",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: true,
        multiKey: "n2",
        properties: [],
        jobs: [
            lua
        ]
    }
    return t
}

const GetDefaultProjectTemplate_PrintCustomParameter = ():Task => {
    const lua:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: DEFAULT_LuaPrintExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print save custom parameters",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            lua
        ]
    }
    return t
}

const GetDefaultProjectTemplate_SaveCustomParameter = ():Task => {
    const lua:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: DEFAULT_LuaSaveExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Save paramter",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            lua
        ]
    }
    return t
}

const GetDefaultProjectTemplate_CronLua = ():Task => {
    const lua:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: DEFAULT_LuaCronMultiExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Run Multiple Lua",
        description: "",
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            lua
        ]
    }
    return t
}


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
        title: "Run Lua",
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
        title: "Print number (With property calc)",
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

const GetDefaultProjectTemplate_OS = ():Task => {
    const testFolder:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["test"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const writef:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_FILE,
        lua: "",
        string_args: ["test/hello.txt", "Hello World"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "OS action",
        description: "",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            testFolder,
            writef
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
        title: "Print number",
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
        title: "Check path",
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
        uuid: uuidv6(),
        canWrite: true,
        containers: [
            { name: "n1", value: 25, type: DataType.Number, runtimeOnly: false, hidden: false },
            { name: "n2", value: 4, type: DataType.Number, runtimeOnly: true, hidden: false },

            { name: "path", value: "C:\\Tool", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "s1", value: "Hello World", type: DataType.String, runtimeOnly: false, hidden: false },

            { name: "b1", value: false, type: DataType.Boolean, runtimeOnly: false, hidden: false }
        ]
    }
    r.parameter = para
    r.task = [
        GetDefaultProjectTemplate_Checker(),
        GetDefaultProjectTemplate_OS(),
        GetDefaultProjectTemplate_Pnumber(),
        GetDefaultProjectTemplate_Pnumber2(),
        GetDefaultProjectTemplate_Lua(),
        GetDefaultProjectTemplate_CronLua(),
        GetDefaultProjectTemplate_SaveCustomParameter(),
        GetDefaultProjectTemplate_PrintCustomParameter(),
        GetDefaultProjectTemplate_PrintCustomParameterMulticore(),
    ]
    return r
}