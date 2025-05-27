import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetFUNIQUE_GS4Project_Parameter } from '../../parameter/GS4';

// Lut convert !!
const GetFUNIQUE_GS4ProjectTemplate_Lut = ():Task => {
    const sequenceJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "ply_lut", "-i %root%/%ck%.ply -l %lut% -o %output%/%ck%.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Lut Apply",
        description: "Generate ply Sequences!!",
        setupjob: false,
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

export const GetFUNIQUE_GS4ProjectTemplate_LUT = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Lut Convert",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter()
    }
    r.parameter = para
    r.task.push(...[
        GetFUNIQUE_GS4ProjectTemplate_Lut(),
    ])
    return r
}