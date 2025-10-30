import { v6 as uuidv6 } from 'uuid'
import { ConditionResult, Job, JobCategory, JobType, JobType2, Database, Project, Task, CreateDefaultJob, CreateDefaultTask } from "../../../interface";
import { GetDefaultProject_Database } from '../../database/Default';
import { DEFAULT_JsCronMultiExample } from '../../js/Default/CronMultiExample';
import { DEFAULT_JsExample } from '../../js/Default/Example';
import { DEFAULT_JsPrintExample } from '../../js/Default/PrintExample';
import { DEFAULT_JsSaveExample } from '../../js/Default/SaveExample';
import { DEFAULT_JsExpressionExample } from '../../js/Default/Expression';
import { DEFAULT_JsLibPrintExample } from '../../js/Default/LibCaller';

const path_checker = ():Task => {
    const checker:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Condition,
        type: JobType2.CHECK_PATH,
        script: "",
        string_args: ["%path%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: [],
        id_args: [],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Check Path",
        jobs: [
            checker
        ]
    }
    return t
}

const database_expression = ():Task => {
    const checker:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "echo", "%e1%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: [],
        id_args: [],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Print Expression",
        cronjob: true,
        cronjobKey: "cluster",
        jobs: [
            checker
        ]
    }
    return t
}

const os_action = ():Task => {
    const testFolder:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%path%/test"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: [],
        id_args: [],
    }
    const writef:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.CREATE_FILE,
        script: "",
        string_args: ["%path%/test/hello.txt", "Hello World"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: [],
        id_args: [],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "OS Action",
        jobs: [
            testFolder,
            writef
        ]
    }
    return t
}

const ck_print = ():Task => {
    const checker:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        string_args: ["", "echo", "%ck%"],
        number_args: [ConditionResult.ThrowProject],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Print Index",
        cronjob: true,
        cronjobKey: "cluster",
        jobs: [
            checker
        ]
    }
    return t
}

const ck_calc_print = ():Task => {
    const checker:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        string_args: ["", "echo", "%prop%"],
        number_args: [ConditionResult.ThrowProject],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Print number (With property calc)",
        cronjob: true,
        cronjobKey: "cluster",
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

const js_print = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Run Js",
        jobs: [
            script
        ],
    }
    return t
}

const js_print_expression = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsExpressionExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Run Js",
        jobs: [
            script
        ],
    }
    return t
}

const js_cron_print = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsCronMultiExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Run Cronjob Js",
        cronjob: true,
        cronjobKey: "cluster",
        jobs: [
            script
        ],
    }
    return t
}

const save_database = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsSaveExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Save Paramter",
        cronjob: true,
        cronjobKey: "cluster",
        jobs: [
            script
        ],
    }
    return t
}

const load_database_multicore = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsPrintExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Load Paramter MultiCore",
        cronjob: true,
        cronjobKey: "cluster",
        multi: true,
        multiKey: "core",
        jobs: [
            script
        ],
    }
    return t
}

const calllib = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.LIB_COMMAND,
        string_args: ["Default", ""],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Call Lib Exe",
        jobs: [
            script
        ],
    }
    return t
}

const calllibjs = ():Task => {
    const script:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsLibPrintExample,
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Call Lib JS Exe",
        properties: [],
        jobs: [
            script
        ],
    }
    return t
}

export const GetDefaultProjectTemplate = (r:Project):Project => {
    const para:Database = {
        title: "Default Database",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetDefaultProject_Database()
    }
    r.database = para
    r.tasks = [
        path_checker(),
        database_expression(),
        os_action(),
        ck_print(),
        ck_calc_print(),
        js_print(),
        js_print_expression(),
        js_cron_print(),
        save_database(),
        load_database_multicore(),
        calllib(),
        calllibjs(),
    ]
    return r
}