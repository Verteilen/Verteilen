import { v6 as uuidv6 } from 'uuid';
import { Job, JobType, Parameter, Project, Task } from "../interface";
import { FUNIQUE_GS4_DENOISE, FUNIQUE_GS4_IFRAMEFOLDER, FUNIQUE_GS4_IFRAMEFOLDER_DONE, FUNIQUE_GS4_PREPARE } from "./luaTemplate";

export const GetDefaultProjectTemplate = (r:Project):Project => {
    return r
}

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

const GetFUNIQUE_GS4ProjectTemplate_Task1 = ():Task => {
    const createsp:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%before%/%ck%/sparse"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "feature_extractor --database_path sparse/database.db --image_path images"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "exhaustive_matcher --database_path sparse/database.db"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "point_triangulator --database sparse/database.db --image_path images --input_path ../sparse/0/TXT/edit --output_path sparse"],
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

const GetFUNIQUE_GS4ProjectTemplate_Task2 = ():Task => {
    const createdir:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP20_I"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start 0 --end %frameCount% --cuda 0 --data %root%/%before% --output %root%/%after%/GOP20_I --sh 3 --interval %iframe_gap% --group_size 1 --resolution 1"],
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
            createdir,
            command2,
            renameDir
        ]
    }
    return t
}

const GetFUNIQUE_GS4ProjectTemplate_Task3 = ():Task => {
    const renamee:Job = {
        uuid: uuidv6(),
        type: JobType.RENAME,
        lua: "",
        string_args: ["%root%/%after%/GOP20_I/%ck%/point_cloud/iteration_7000/point_cloud.ply", "%root%/%after%/GOP20_I/%ck%/point_cloud/iteration_7000/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP20_I/%ck%/point_cloud/iteration_7000", "ply_to_ascii", "-i point_cloud_before.ply -o ascii.ply"],
        number_args: [],
        boolean_args: []
    }
    const stringhelper:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_DENOISE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/GOP20_I/%ck%/point_cloud/iteration_7000", "ply_return_ascii", "-i ascii.ply -o point_cloud.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "降躁處理",
        description: "把渣渣刪掉 !",
        cronjob: true,
        cronjobKey: "iframeCount",
        multi: false,
        multiKey: "",
        jobs: [
            renamee,
            command1,
            stringhelper,
            command2
        ]
    }
    return t
}

const GetFUNIQUE_GS4ProjectTemplate_Task4 = ():Task => {
    const renamedir:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_IFRAMEFOLDER_DONE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start %{ iframe_gap * 0 }% --end %frameCount% --cuda 0 --data C:\videogs\VideoGS\datasets\B --output %root%/%after% --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start %{ iframe_gap * 1 }% --end %frameCount% --cuda 0 --data C:\videogs\VideoGS\datasets\B --output %root%/%after% --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start %{ iframe_gap * 2 }% --end %frameCount% --cuda 0 --data C:\videogs\VideoGS\datasets\B --output %root%/%after% --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const command4:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%", "python", "train_sequence.py --start %{ iframe_gap * 3 }% --end %frameCount% --cuda 0 --data C:\videogs\VideoGS\datasets\B --output %root%/%after% --sh 3 --interval 1 --group_size %group_size% --resolution 1"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Blend 資料準備",
        description: "生成多個 checkpoint 資料夾",
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        jobs: [
            renamedir,
            command1,
            command2,
            command3,
            command4
        ]
    }
    return t
}

const GetFUNIQUE_GS4ProjectTemplate_Task5 = ():Task => {
    
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

const GetFUNIQUE_GS4ProjectTemplate_Task6 = ():Task => {
    
    const t:Task = {
        uuid: uuidv6(),
        title: "Lut",
        description: "顏色校準",
        cronjob: false,
        cronjobKey: "",
        multi: true,
        multiKey: "lut_thread",
        jobs: [
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "frameCount", value: 0 },
            { name: "iframeCount", value: 0 },
            { name: "iframe_gap", value: 5 },
            { name: "lut_thread", value: 5 },
            { name: "group_size", value: 20 },
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
        GetFUNIQUE_GS4ProjectTemplate_Task6()
    ])
    return r
}

export const GetConcatProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "frameCount", value: 0 },
        ],
        strings: [
            { name: "root", value: "" },
        ],
        booleans: [],
    }
    r.parameter = para
    return r
}