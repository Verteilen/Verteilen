import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";

// Blend 生成多個 checkpoint 資料夾 (正)
const GetFUNIQUE_GS4ProjectTemplate_Checkpoint_P = ():Task => {
    const createdir:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COPY_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_P20_I", "%root%/%after%/GOP_P%{ ck - 1 * iframe_gap }%_R"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
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
        properties: [],
        jobs: [
            createdir,
            command1
        ]
    }
    return t
}

// Blend 生成多個 checkpoint 資料夾 (反)
const GetFUNIQUE_GS4ProjectTemplate_Checkpoint_N = ():Task => {
    const createdir:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COPY_DIR,
        lua: "",
        string_args: ["%root%/%after%/GOP_N20_I", "%root%/%after%/GOP_N%{ ck - 1 * iframe_gap }%_R"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
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
        properties: [],
        jobs: [
            createdir,
            command1
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate2 = (r:Project):Project => {
    const para:Parameter = {
        numbers: [
            { name: "frameCount", value: 20 },
            { name: "iframe_gap", value: 5 },
            { name: "lut_thread", value: 5 },
            { name: "group_size", value: 20 },
            { name: "blend", value: 4 },
            { name: "contribute", value: 2 },
            { name: "iframe_size", value: 0 },
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
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_P(),
        GetFUNIQUE_GS4ProjectTemplate_Checkpoint_N()
    ])
    return r
}