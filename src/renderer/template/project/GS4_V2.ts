import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";
import { FUNIQUE_GS4_V2_BLEND_PREPARE, FUNIQUE_GS4_V2_COLMAP_COPY, FUNIQUE_GS4_V2_PLYDone } from '../lua/GS4_V2';
import { GetFUNIQUE_GS4ProjectTemplate_Blend1, GetFUNIQUE_GS4ProjectTemplate_Blend2, GetFUNIQUE_GS4ProjectTemplate_Colmap, GetFUNIQUE_GS4ProjectTemplate_Denoise, GetFUNIQUE_GS4ProjectTemplate_IFrame, GetFUNIQUE_GS4ProjectTemplate_IFrameBackup, GetFUNIQUE_GS4ProjectTemplate_IFrameGTP_Adjustment, GetFUNIQUE_GS4ProjectTemplate_Prepare } from './GS4';
import { GetFUNIQUE_GS4Project_Parameter } from '../parameter/GS4';

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
const GetFUNIQUE_GS4ProjectTemplate_BlendPrepare = ():Task => {
    const copyhelper:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        script: FUNIQUE_GS4_V2_COLMAP_COPY,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "排序改變",
        description: "準備 PN Dataset",
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
const GetFUNIQUE_GS4ProjectTemplate_BlendPrepare2 = ():Task => {
    const copyhelper2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        script: FUNIQUE_GS4_V2_BLEND_PREPARE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "負向準備",
        description: "準備 Blend PN 資料夾",
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

// Blend 生成多個 checkpoint 資料夾 (正)
const GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Position = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --density %density_util% --gtp %gtp% --start %gap_value% --end %frameCount_p% --iframe 0 --data %root%/%after%/DATASET_P_%blend_value% --output %root%/%after%/BLEND_%blend_value%_IP/ --group_size %gap_p% --iteration %iframe_iteration% --grad %densify_grad% --dynamic %finetune_iteration% %train_command% --interval 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備 (正)",
        description: "生成多個 checkpoint 資料夾",
        setupjob: false,
        cronjob: true,
        cronjobKey: "blend",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + 1'
            },
            {
                name: 'blend_value',
                expression: '(ck - 1) * iframe_gap'
            },
            {
                name: 'frameCount_p',
                expression: 'data_p__ck_'
            },
            {
                name: 'gap_p',
                expression: 'gop_positive + 1'
            }
        ],
        jobs: [
            command1
        ]
    }
    return t
}

// Blend 生成多個 checkpoint 資料夾 (負)
const GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Negative = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --density %density_util% --gtp %gtp% --start %gap_value% --end %frameCount_n% --iframe 0 --data %root%/%after%/DATASET_N_%blend_value% --output %root%/%after%/BLEND_%blend_value%_IN/ --group_size %gap_n% --iteration %iframe_iteration% --grad %densify_grad% --dynamic %finetune_iteration% %train_command% --interval 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備 (負)",
        description: "生成多個 checkpoint 資料夾",
        setupjob: false,
        cronjob: true,
        cronjobKey: "blend",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + 1'
            },
            {
                name: 'blend_value',
                expression: '(ck - 1) * iframe_gap'
            },
            {
                name: 'frameCount_n',
                expression: 'data_n__ck_'
            },
            {
                name: 'gap_n',
                expression: 'gop_negative + 1'
            }
        ],
        jobs: [
            command1
        ]
    }
    return t
}

// 生成 ply 序列!!
const GetFUNIQUE_GS4ProjectTemplate_PlyList = ():Task => {
    const sequenceJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        script: FUNIQUE_GS4_V2_PLYDone,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Ply 輸出",
        description: "生成 ply 序列!!",
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

export const GetFUNIQUE_GS4Project_V2_Template = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        title: "GS4_V2 Parameter",
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter()
    }
    r.parameter = para
    r.task.push(...[
        GetFUNIQUE_GS4ProjectTemplate_Prepare(),
        GetFUNIQUE_GS4ProjectTemplate_Colmap(),
        GetFUNIQUE_GS4ProjectTemplate_IFrame(),
        GetFUNIQUE_GS4ProjectTemplate_Denoise(),
        GetFUNIQUE_GS4ProjectTemplate_IFrameBackup(),
        GetFUNIQUE_GS4ProjectTemplate_IFrameGTP_Adjustment(),
        GetFUNIQUE_GS4ProjectTemplate_BlendPrepare(),
        GetFUNIQUE_GS4ProjectTemplate_BlendPrepare2(),
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Position(),
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Negative(),
        GetFUNIQUE_GS4ProjectTemplate_PlyList(),
        GetFUNIQUE_GS4ProjectTemplate_Blend1(),
        GetFUNIQUE_GS4ProjectTemplate_Blend2()
    ])
    return r
}