import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";

// Lut convert !!
const GetFUNIQUE_GS4ProjectTemplate_Lut = ():Task => {
    const sequenceJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["", "ply_lut", "-i %root%/%ck%.ply -l %lut% -o %output%/%ck%.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Ply 輸出",
        description: "生成 ply 序列!!",
        cronjob: true,
        cronjobKey: "frameCount",
        multi: true,
        multiKey: "core",
        properties: [],
        jobs: [
            sequenceJob
        ]
    }
    return t
}

export const GetFUNIQUE_GS4LUTProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        canWrite: true,
        containers: [
            { name: "frameCount", value: 50, type: DataType.Number, runtimeOnly: false, hidden: false },
            { name: "core", value: 5, type: DataType.Number, runtimeOnly: false, hidden: false },

            { name: "root", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "output", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "lut", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
        ]
    }
    r.parameter = para
    r.task.push(...[
        GetFUNIQUE_GS4ProjectTemplate_Lut(),
    ])
    return r
}