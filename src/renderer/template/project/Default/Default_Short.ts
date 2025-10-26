import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, ConditionResult, Project, Database } from '../../../interface';

const ck_print = ():Task => {
    const checker:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "echo", "%ck%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: [],
        id_args: [],
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

export const GetDefaultProjectTemplate_Short = (r:Project):Project => {
    r.database = undefined
    r.task = [
        ck_print(),
    ]
    return r
}