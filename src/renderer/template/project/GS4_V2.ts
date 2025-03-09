import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";
import { FUNIQUE_GS4_V2_BLEND_PREPARE, FUNIQUE_GS4_V2_COLMAP_COPY } from '../lua/GS4_V2';
import { FUNIQUE_GS4_PLYDone } from "./../lua/GS4";
import { GetFUNIQUE_GS4ProjectTemplate_Checker, GetFUNIQUE_GS4ProjectTemplate_Colmap, GetFUNIQUE_GS4ProjectTemplate_Denoise, GetFUNIQUE_GS4ProjectTemplate_IFrame, GetFUNIQUE_GS4ProjectTemplate_IFrameBackup, GetFUNIQUE_GS4ProjectTemplate_Prepare } from './GS4';

// 排序改變 優化品質做的準備
// Colmap 的結構複製一個負的出來
const GetFUNIQUE_GS4ProjectTemplate_BlendPrepare = ():Task => {
    const copyhelper:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: FUNIQUE_GS4_V2_COLMAP_COPY,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const copyhelper2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: FUNIQUE_GS4_V2_BLEND_PREPARE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "排序改變, 負向準備",
        description: "優化品質複製, Colmap 結構準備負方向的",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            copyhelper,
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
        lua: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --start %gap_value% --end %frameCount% --cuda 0 --iframe 0 --data %root%/%before% --output %root%/%after%/BLEND_%blend_value%_I/ --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備 (正)",
        description: "生成多個 checkpoint 資料夾",
        cronjob: true,
        cronjobKey: "blend",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + IF( start_at_0, 0, 1 )'
            },
            {
                name: 'blend_value',
                expression: '(ck - 1) * iframe_gap'
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
        lua: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --start %gap_value% --end %frameCount% --cuda 0 --iframe 0 --data %root%/%before% --output %root%/%after%/BLEND_%blend_value%_I/ --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備 (正)",
        description: "生成多個 checkpoint 資料夾",
        cronjob: true,
        cronjobKey: "blend",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + IF( start_at_0, 0, 1 )'
            },
            {
                name: 'blend_value',
                expression: '(ck - 1) * iframe_gap'
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
        lua: FUNIQUE_GS4_PLYDone,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Ply 輸出",
        description: "生成 ply 序列!!",
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

const GetFUNIQUE_GS4ProjectTemplate_Blend1 = ():Task => {
    const transparentJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%output%", "ply_blend", "-t 0 -f %index% -b %blend% -g %iframe_gap% -c %contribute% -r %output%/raw -o %output%/trans"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blending 程序 透明度調整",
        description: "Ply 透明度調整",
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'index',
                expression: '(ck - 1) + IF( start_at_0, 0, 1 )'
            }
        ],
        jobs: [
            transparentJob
        ]
    }
    return t
}

const GetFUNIQUE_GS4ProjectTemplate_Blend2 = ():Task => {
    const mergeJob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%output%", "ply_blend", "-t 1 -f %index% -b %blend% -g %iframe_gap% -c %contribute% -r %output%/trans -o %output%/final"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blending 程序 合成",
        description: "Ply 多序包裝成單序",
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'index',
                expression: '(ck - 1) + IF( start_at_0, 0, 1 )'
            }
        ],
        jobs: [
            mergeJob
        ]
    }
    return t
}

export const GetFUNIQUE_GS4Project_V2_Template = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "frameCount", value: 20 },
            { name: "iframe_gap", value: 5 },
            { name: "lut_thread", value: 5 },
            { name: "group_size", value: 20 },
            { name: "blend", value: 4 },
            { name: "contribute", value: 2 },
            { name: "iframe_size", value: 0 },
            { name: "denoise", value: 0 },
        ],
        strings: [
            { name: "root", value: "G:/Developer/Funique/4DGS/Test" },
            { name: "output", value: "G:/Developer/Funique/4DGS/Test/out" },
            { name: "prepare", value: "Prepare" },
            { name: "before", value: "before" },
            { name: "after", value: "after" },
            { name: "CAM", value: "CAM" },
            { name: "images", value: "images" },
            { name: "sparse", value: "sparse" },
            { name: "videogs", value: "C:/videogs/VideoGS" },
            { name: "conda_env", value: "videogs" },
        ],
        booleans: [
            { name: "start_at_0", value: false }
        ],
    }
    r.parameter = para
    r.task.push(...[
        GetFUNIQUE_GS4ProjectTemplate_Checker(),
        GetFUNIQUE_GS4ProjectTemplate_Prepare(),
        GetFUNIQUE_GS4ProjectTemplate_Colmap(),
        GetFUNIQUE_GS4ProjectTemplate_IFrame(),
        GetFUNIQUE_GS4ProjectTemplate_IFrameBackup(),
        GetFUNIQUE_GS4ProjectTemplate_Denoise(),
        GetFUNIQUE_GS4ProjectTemplate_BlendPrepare(),
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Position(),
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_Negative(),
        GetFUNIQUE_GS4ProjectTemplate_PlyList(),
        GetFUNIQUE_GS4ProjectTemplate_Blend1(),
        GetFUNIQUE_GS4ProjectTemplate_Blend2()
    ])
    return r
}