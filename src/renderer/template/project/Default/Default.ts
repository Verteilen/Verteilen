import { v6 as uuidv6 } from 'uuid';
import { ConditionResult, Job, JobCategory, JobType, JobType2, Parameter, Project, Task } from "../../../interface";
import { GetDefaultProject_Parameter } from '../../parameter/Default';
import { DEFAULT_JsCronMultiExample } from '../../js/Default/CronMultiExample';
import { DEFAULT_JsExample } from '../../js/Default/Example';
import { DEFAULT_JsPrintExample } from '../../js/Default/PrintExample';
import { DEFAULT_JsSaveExample } from '../../js/Default/SaveExample';
import { DEFAULT_JsExpressionExample } from '../../js/Default/Expression';

const path_checker = ():Task => {
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
        title: "Check Path",
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

const parameter_expression = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "echo", "%e1%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Print Expression",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            checker
        ]
    }
    return t
}

const os_action = ():Task => {
    const testFolder:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%path%/test"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const writef:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_FILE,
        script: "",
        string_args: ["%path%/test/hello.txt", "Hello World"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "OS Action",
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

const ck_print = ():Task => {
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
        title: "Print Index",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            checker
        ]
    }
    return t
}

const ck_calc_print = ():Task => {
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
        cronjobKey: "cluster",
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

const js_print = ():Task => {
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

const js_print_expression = ():Task => {
    const script:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: DEFAULT_JsExpressionExample,
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

const js_cron_print = ():Task => {
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
        title: "Run Cronjob Js",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const save_parameter = ():Task => {
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
        title: "Save Paramter",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            script
        ]
    }
    return t
}

const load_parameter_multicore = ():Task => {
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
        title: "Load Paramter MultiCore",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: true,
        multiKey: "core",
        properties: [],
        jobs: [
            script
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
        path_checker(),
        parameter_expression(),
        os_action(),
        ck_print(),
        ck_calc_print(),
        js_print(),
        js_print_expression(),
        js_cron_print(),
        save_parameter(),
        load_parameter_multicore(),
    ]
    return r
}