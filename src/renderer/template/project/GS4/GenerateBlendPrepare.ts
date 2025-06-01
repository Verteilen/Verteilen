import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, Parameter, Project } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';
import { FUNIQUE_GS4_BLEND_PREPARE_V2 } from '../../js/GS4/BlendPrepare_V2';
import { FUNIQUE_GS4_COLMAP_COPY_V2 } from '../../js/GS4/ColmapCopy';

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
const BlendPrepare = ():Task => {
    const copyhelper:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: FUNIQUE_GS4_COLMAP_COPY_V2,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Sorting",
        description: "Prepare PN Dataset",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            copyhelper,
        ]
    }
    return t
}

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
const BlendPrepare2 = ():Task => {
    const copyhelper2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: FUNIQUE_GS4_BLEND_PREPARE_V2,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Sorting 2",
        description: "Prepare Blend PN Folders",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            copyhelper2
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_BlendPrepare = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Blend Prepare Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task.push(...[
        BlendPrepare(),
        BlendPrepare2(),
    ])
    return r
}