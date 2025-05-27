import { v6 as uuidv6 } from 'uuid';
import { ConditionResult, DataType, Job, JobCategory, JobType, JobType2, Parameter, Project, Task } from "../../interface";
import { DEFAULT_JsCronMultiExample, DEFAULT_JsExample, DEFAULT_JsPrintExample, DEFAULT_JsSaveExample } from '../js/Default';
import { GetDefaultProject_Parameter } from '../parameter/Default';

const GetDefaultProjectTemplate_PrintCustomParameterMulticore = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsPrintExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print save custom parameters with multicore",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "n1",
        multi: true,
        multiKey: "n2",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const GetDefaultProjectTemplate_PrintCustomParameter = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsPrintExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print save custom parameters",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const GetDefaultProjectTemplate_SaveCustomParameter = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsSaveExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Save paramter",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const GetDefaultProjectTemplate_CronJs = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsCronMultiExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Run Multiple Js",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "n1",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}


const GetDefaultProjectTemplate_Js = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsExample,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Run Js",
        description: "",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const GetDefaultProjectTemplate_Pnumber2 = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "echo", "%prop%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print number (With property calc)",
        description: "",
        setupjob: false,
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
        script: "",
        string_args: ["test"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const writef:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_FILE,
        script: "",
        string_args: ["test/hello.txt", "Hello World"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "OS action",
        description: "",
        setupjob: false,
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
        script: "",
        string_args: ["", "echo", "%ck%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print number",
        description: "",
        setupjob: false,
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
        script: "",
        string_args: ["%path%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Check path",
        description: "",
        setupjob: false,
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
        title: "Default Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetDefaultProject_Parameter()
    }
    r.parameter = para
    r.task = [
        GetDefaultProjectTemplate_Checker(),
        GetDefaultProjectTemplate_OS(),
        GetDefaultProjectTemplate_Pnumber(),
        GetDefaultProjectTemplate_Pnumber2(),
        GetDefaultProjectTemplate_Js(),
        GetDefaultProjectTemplate_CronJs(),
        GetDefaultProjectTemplate_SaveCustomParameter(),
        GetDefaultProjectTemplate_PrintCustomParameter(),
        GetDefaultProjectTemplate_PrintCustomParameterMulticore(),
    ]
    return r
}