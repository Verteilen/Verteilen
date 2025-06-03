import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';

export const PlyBlend1 = ():Task => {
    const transparentJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%output%", "ply_blend", "-t 0 -f %frame_index% -b %blend% -g %iframe_gap% -c %contribute% -r %output%/raw -o %output%/trans -x 0"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blending 程序 透明度調整",
        description: "Ply 透明度調整",
        setupjob: false,
        cronjob: true,
        cronjobKey: "frameCount",
        multi: true,
        multiKey: "core",
        properties: [
            {
                name: 'frame_index',
                expression: "ck - 1"
            }
        ],
        jobs: [
            transparentJob
        ]
    }
    return t
}

export const PlyBlend2 = ():Task => {
    const mergeJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%output%", "ply_blend", "-t 1 -f %ck% -b %blend% -g %iframe_gap% -c %contribute% -r %output%/trans -o %output%/final"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blending 程序 合成",
        description: "Ply 多序包裝成單序",
        setupjob: false,
        cronjob: true,
        cronjobKey: "frameCount",
        multi: true,
        multiKey: "core",
        properties: [],
        jobs: [
            mergeJob
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_PlyBlend = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Ply Blend Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task.push(...[
        PlyBlend1(),
        PlyBlend2(),
    ])
    return r
}