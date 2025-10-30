import { Task, Job, JobCategory, JobType, ConditionResult, Project, Database, CreateDefaultTask, CreateDefaultJob } from '../../../interface';

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
        ],
    }
    return t
}

export const GetDefaultProjectTemplate_Short = (r:Project):Project => {
    r.database = undefined
    r.tasks = [
        ck_print(),
    ]
    return r
}