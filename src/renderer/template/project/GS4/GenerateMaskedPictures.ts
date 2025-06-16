import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, Parameter, Project } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
export const CallMask = ():Task => {
    const folder1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%root%/%prepare%/%%mask%"],
        number_args: [],
        boolean_args: []
    }
    const folder2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%root%/%prepare%/%CAM%"],
        number_args: [],
        boolean_args: []
    }
    const maskJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%mask_env_folder%", "python", "BiRefNet.py -i %root%/%prepare%/%unmask% -o %root%/%prepare%/%mask%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Masking",
        description: "Prepare the folder",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            folder1,
            folder2,
            maskJob,
        ]
    }
    return t
}

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
export const MaskFFmpeg = ():Task => {
    const copyhelper2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%mask_env_folder%", "ffmpeg", "-i %root%/%prepare%/%unmask%/%ck% -i %root%/%prepare%/%mask%/%ck% -filter_complex \"blend=all_mode=multiply\" %root%/%prepare%/%CAM%/%ck%.png"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Use Background",
        description: "Apply background",
        setupjob: false,
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            copyhelper2
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_Mask = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Blend Mask Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task.push(...[
        CallMask(),
        MaskFFmpeg(),
    ])
    return r
}