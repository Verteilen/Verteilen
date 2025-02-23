import { v6 as uuidv6 } from 'uuid';
import { ConditionResult, Job, JobCategory, JobType, JobType2, Parameter, Project, Task } from "../../interface";
import { FUNIQUE_GS4_BLEND_PREPARE, FUNIQUE_GS4_PLYDone, FUNIQUE_GS4_PREPARE } from "./../lua/GS4";

const GetFUNIQUE_GS4ProjectTemplate_Checker = ():Task => {
    const prepareExist:Job = {
        uuid: uuidv6(),
        category: JobCategory.Condition,
        type: JobType2.CHECK_PATH,
        lua: "",
        string_args: ["%root%/%prepare%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const videogsExist:Job = {
        uuid: uuidv6(),
        category: JobCategory.Condition,
        type: JobType2.CHECK_PATH,
        lua: "",
        string_args: ["%videogs%"],
        number_args: [ConditionResult.ThrowProject],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "檢查階段",
        description: "從原始資料檢查正確性",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            prepareExist,
            videogsExist
        ]
    }
    return t
}

// 從原始資料夾結構 弄成可以工作的樣子
const GetFUNIQUE_GS4ProjectTemplate_Prepare = ():Task => {
    const sortjob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: FUNIQUE_GS4_PREPARE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const copyjob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COPY_FILE,
        lua: "",
        string_args: ["%root%/%prepare%/train_sequence.py", "%root%/%after%/train_sequence.py"],
        number_args: [],
        boolean_args: []
    }
    const createdir:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_20_I"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "整理階段",
        description: "從原始資料夾結構 弄成可以工作的樣子",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            sortjob,
            copyjob,
            createdir
        ]
    }
    return t
}

// 利用 Colmap 工具生成 .bin 資料
const GetFUNIQUE_GS4ProjectTemplate_Colmap = ():Task => {
    const createsp:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%before%/%{ ck - 1 }%/sparse/0"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%{ ck - 1 }%", "colmap", "feature_extractor --database_path sparse/0/database.db --image_path images"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%{ ck - 1 }%", "colmap", "exhaustive_matcher --database_path sparse/0/database.db"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%{ ck - 1 }%", "colmap", "point_triangulator --database sparse/0/database.db --image_path images --input_path ../sparse/0/TXT/edit --output_path sparse/0"],
        number_args: [],
        boolean_args: []
    }

    const t:Task = {
        uuid: uuidv6(),
        title: "運算資料準備",
        description: "利用 Colmap 工具生成 .bin 資料",
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        jobs: [
            createsp,
            command1,
            command2,
            command3
        ]
    }
    return t
}

// 生成完整 I-Frame
const GetFUNIQUE_GS4ProjectTemplate_IFrame = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --start %{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }% --end %{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }% --cuda 0 --data %root%/%before% --output %root%/%after%/GOP_20_I --sh 3 --interval %iframe_gap% --group_size 1 --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    
    const t:Task = {
        uuid: uuidv6(),
        title: "生成 I Frame",
        description: "生成完整 Frame",
        cronjob: true,
        cronjobKey: "iframe_size",
        multi: false,
        multiKey: "",
        jobs: [
            command1,
        ]
    }
    return t
}

// 備份 I-Frame
const GetFUNIQUE_GS4ProjectTemplate_IFrameBackup = ():Task => {
    const backup:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COPY_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_20_I", "%root%/%after%/GOP_20_I_Backup"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "備份 I Frame",
        description: "將剛完成的 IFrame 進行備份處理",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            backup
        ]
    }
    return t
}

// 把渣渣刪掉 !
const GetFUNIQUE_GS4ProjectTemplate_Denoise = ():Task => {
    const renamee:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.RENAME,
        lua: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }%/point_cloud/iteration_7000/point_cloud.ply", "%root%/%after%/GOP_20_I/checkpoint/%{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }%/point_cloud/iteration_7000", "ply_denoise", "-i point_cloud_before.ply -o point_cloud.ply -r %denoise% -g %denoise% -b %denoise%"],
        number_args: [],
        boolean_args: []
    }
    const deleted:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.DELETE_FILE,
        lua: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "降躁處理",
        description: "把渣渣刪掉 !",
        cronjob: true,
        cronjobKey: "iframe_size",
        multi: false,
        multiKey: "",
        jobs: [
            renamee,
            command1,
            deleted
        ]
    }
    return t
}

// 排序改變 優化品質做的準備
const GetFUNIQUE_GS4ProjectTemplate_BlendPrepare = ():Task => {
    const copyhelper:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        lua: FUNIQUE_GS4_BLEND_PREPARE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "排序改變",
        description: "優化品質複製",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            copyhelper
        ]
    }
    return t
}

// Blend 生成多個 checkpoint 資料夾
const GetFUNIQUE_GS4ProjectTemplate_Checkpoint = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence.py --start %{ (ck - 1) * iframe_gap + IF( start_at_0, 0, 1 ) }% --end %frameCount% --cuda 0 --data %root%/%before% --output %root%/%after%/BLEND_%{ ck - 1 }%_I/ --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
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
        title: "Blending",
        description: "生成 ply 序列!!",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            sequenceJob
        ]
    }
    return t
}

// Lut 顏色校準
const GetFUNIQUE_GS4ProjectTemplate_Lut = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%output%/", "ply_lut", "-i %root%/%after%/%{ ck }%_merged.ply -o %root%/%after%/%{ ck }%.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Lut",
        description: "顏色校準",
        cronjob: true,
        cronjobKey: "frameCount",
        multi: true,
        multiKey: "lut_thread",
        jobs: [
            command1
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate = (r:Project):Project => {
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
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint(),
        GetFUNIQUE_GS4ProjectTemplate_PlyList(),
        GetFUNIQUE_GS4ProjectTemplate_Lut()
    ])
    return r
}