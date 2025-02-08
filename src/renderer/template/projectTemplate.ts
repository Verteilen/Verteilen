import { v6 as uuidv6 } from 'uuid';
import { Job, JobType, Parameter, Project, Task } from "../interface";
import { FUNIQUE_GS4_V1 } from "./luaTemplate";

export const GetDefaultProjectTemplate = (r:Project):Project => {
    return r
}

export const GetFUNIQUE_GS4ProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "frameCount", value: 0 },
        ],
        strings: [
            { name: "root", value: "" },
            { name: "prepare", value: "Prepare" },
            { name: "before", value: "before" },
            { name: "after", value: "after" },
            { name: "CAM", value: "CAM" },
            { name: "images", value: "images" },
            { name: "sparse", value: "sparse" },
        ],
        booleans: [],
    }
    const sortjob:Job = {
        uuid: uuidv6(),
        type: JobType.LUA,
        lua: FUNIQUE_GS4_V1,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const createdir:Job = {
        uuid: uuidv6(),
        type: JobType.CREATE_DIR,
        lua: "",
        string_args: ["%root%/%after%/%ck%"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        type: JobType.COMMAND,
        lua: "",
        string_args: ["%root%/%after%/%ck%", "colmap", "..."],
        number_args: [],
        boolean_args: []
    }
    const startTask:Task = {
        uuid: uuidv6(),
        title: "整理階段",
        description: "從原始資料夾結構 弄成可以工作的樣子",
        cronjob: false,
        cronjobKey: "",
        jobs: [
            sortjob
        ]
    }
    const working:Task = {
        uuid: uuidv6(),
        title: "運算階段",
        description: "正式開始進行演算",
        cronjob: true,
        cronjobKey: "frameCount",
        jobs: [
            createdir,
            command1
        ]
    }
    const final:Task = {
        uuid: uuidv6(),
        title: "總結",
        description: "最後的工作階段",
        cronjob: false,
        cronjobKey: "",
        jobs: [
        ]
    }
    r.parameter = para
    r.task.push(...[
        startTask,
        working,
        final
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