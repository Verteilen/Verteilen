import { v6 as uuidv6 } from 'uuid';
import { Job, JobType, Parameter, Project, Task } from "../interface";
import { FUNIQUE_GS4_COPY, FUNIQUE_GS4_IFRAMEFOLDER, FUNIQUE_GS4_PREPARE } from "./luaTemplate";

export const GetDefaultProjectTemplate = (r:Project):Project => {
    return r
}

// 從原始資料夾結構 弄成可以工作的樣子
const GetFUNIQUE_GS4ProjectTemplate_Task0 = ():Task => {
    const sortjob:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_PREPARE,
        string_args: [],
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
            sortjob
        ]
    }
    return t
}

// 利用 Colmap 工具生成 .bin 資料
const GetFUNIQUE_GS4ProjectTemplate_Task1 = ():Task => {
    const createsp:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%before_sort%/%ck%/sparse"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before_sort%/%ck%", "colmap", "feature_extractor --database_path sparse/database.db --image_path images"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before_sort%/%ck%", "colmap", "exhaustive_matcher --database_path sparse/database.db"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before_sort%/%ck%", "colmap", "point_triangulator --database sparse/database.db --image_path images --input_path ../sparse/0/TXT/edit --output_path sparse"],
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

// 優化品質做的準備
const GetFUNIQUE_GS4ProjectTemplate_Task2 = ():Task => {
    const copyhelper:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_COPY,
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

// 生成完整 Frame
const GetFUNIQUE_GS4ProjectTemplate_Task3 = ():Task => {
    const createdir_p:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I"],
        number_args: [],
        boolean_args: []
    }
    const createdir_n:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start 0 --end %frameCount% --cuda 0 --data %root%/%before_p% --output %root%/%after%/GOP_P20_I --sh 3 --interval %iframe_gap% --group_size 1 --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start 0 --end %frameCount% --cuda 0 --data %root%/%before_n% --output %root%/%after%/GOP_N20_I --sh 3 --interval %iframe_gap% --group_size 1 --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const renameDir:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_IFRAMEFOLDER,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "生成 I Frame",
        description: "生成完整 Frame",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            createdir_p,
            createdir_n,
            command3,
            command2,
            renameDir
        ]
    }
    return t
}

// 把渣渣刪掉 ! (正)
const GetFUNIQUE_GS4ProjectTemplate_Task4 = ():Task => {
    const renamee:Job = {
        uuid: uuidv6(),
        type: JobType.RENAME,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud.ply", "%root%/%after%/GOP_P20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000", "ply_denoise", "-i point_cloud_before.ply -o point_cloud.ply"],
        number_args: [],
        boolean_args: []
    }
    const deleted:Job = {
        uuid: uuidv6(),
        type: JobType.DELETE_FILE,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "降躁處理 (正)",
        description: "把渣渣刪掉 !",
        cronjob: true,
        cronjobKey: "p_iframe_size",
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

// 把渣渣刪掉 ! (反)
const GetFUNIQUE_GS4ProjectTemplate_Task5 = ():Task => {
    const renamee:Job = {
        uuid: uuidv6(),
        type: JobType.RENAME,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud.ply", "%root%/%after%/GOP_N20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000", "ply_denoise", "-i point_cloud_before.ply -o point_cloud.ply"],
        number_args: [],
        boolean_args: []
    }
    const deleted:Job = {
        uuid: uuidv6(),
        type: JobType.DELETE_FILE,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I/%{ (ck - 1) * iframe_gap }%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "降躁處理 (反)",
        description: "把渣渣刪掉 !",
        cronjob: true,
        cronjobKey: "n_iframe_size",
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

// Blend 生成多個 checkpoint 資料夾 (正)
const GetFUNIQUE_GS4ProjectTemplate_Task6 = ():Task => {
    const createdir:Job = {
        uuid: uuidv6(),
        type: JobType.COPY_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I", "%root%/%after%/GOP_P%{ ck - 1 * iframe_gap }%_R"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP_P%{ ck - 1 * iframe_gap }%_R", "python", "train_sequence.py --start %{ iframe_gap * 0 }% --end %p_size% --cuda 0 --data %root%/%before_p% --output %root%/%after%/GOP_P%{ ck - 1 * iframe_gap }%_R --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
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
            createdir,
            command1
        ]
    }
    return t
}

// Blend 生成多個 checkpoint 資料夾 (反)
const GetFUNIQUE_GS4ProjectTemplate_Task7 = ():Task => {
    const createdir:Job = {
        uuid: uuidv6(),
        type: JobType.COPY_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I", "%root%/%after%/GOP_N%{ ck - 1 * iframe_gap }%_R"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP_N%{ ck - 1 * iframe_gap }%_R", "python", "train_sequence.py --start %{ iframe_gap * 0 }% --end %n_size% --cuda 0 --data %root%/%before_n% --output %root%/%after%/GOP_N%{ ck - 1 * iframe_gap }%_R --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備 (反)",
        description: "生成多個 checkpoint 資料夾",
        cronjob: true,
        cronjobKey: "blend",
        multi: false,
        multiKey: "",
        jobs: [
            createdir,
            command1
        ]
    }
    return t
}

// 生成 ply 序列!!
const GetFUNIQUE_GS4ProjectTemplate_Task8 = ():Task => {
    //%root%/%after%/GOP_N20_I
    //%root%/%after%/GOP_P20_I
    const t:Task = {
        uuid: uuidv6(),
        title: "Blending",
        description: "生成 ply 序列!!",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
        ]
    }
    return t
}

// Lut 顏色校準
const GetFUNIQUE_GS4ProjectTemplate_Task9 = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
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
            { name: "frameCount", value: 0 },
            { name: "iframe_gap", value: 5 },
            { name: "lut_thread", value: 5 },
            { name: "group_size", value: 20 },
            { name: "blend", value: 4 },
            { name: "p_size", value: 0 },
            { name: "n_size", value: 0 },
            { name: "n_iframe_size", value: 0 },
            { name: "p_iframe_size", value: 0 },
        ],
        strings: [
            { name: "root", value: "G:/Developer/Funique/4DGS/Test" },
            { name: "output", value: "G:/Developer/Funique/4DGS/Test/out" },
            { name: "prepare", value: "Prepare" },
            { name: "before_sort", value: "before_sort" },
            { name: "before_p", value: "before_p" },
            { name: "before_n", value: "before_n" },
            { name: "after", value: "after" },
            { name: "CAM", value: "CAM" },
            { name: "images", value: "images" },
            { name: "sparse", value: "sparse" },
        ],
        booleans: [],
    }
    r.parameter = para
    r.task.push(...[
        GetFUNIQUE_GS4ProjectTemplate_Task0(),
        GetFUNIQUE_GS4ProjectTemplate_Task1(),
        GetFUNIQUE_GS4ProjectTemplate_Task2(),
        GetFUNIQUE_GS4ProjectTemplate_Task3(),
        GetFUNIQUE_GS4ProjectTemplate_Task4(),
        GetFUNIQUE_GS4ProjectTemplate_Task5(),
        GetFUNIQUE_GS4ProjectTemplate_Task6(),
        GetFUNIQUE_GS4ProjectTemplate_Task7(),
        GetFUNIQUE_GS4ProjectTemplate_Task8(),
        GetFUNIQUE_GS4ProjectTemplate_Task9()
    ])
    return r
}
