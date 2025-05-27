import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, Project, Parameter } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter } from '../../parameter/GS4';
import { FUNIQUE_GS4_PLYDone_V2 } from '../../js/GS4/PlyDone_V2';

const PlyList = ():Task => {
    const sequenceJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        script: FUNIQUE_GS4_PLYDone_V2,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Ply Output",
        description: "Generate ply sequences!!",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            sequenceJob
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_PLYOutput = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Ply Output",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter()
    }
    r.parameter = para
    r.task.push(...[
        PlyList(),
    ])
    return r
}