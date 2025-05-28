import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';
import { FUNIQUE_GS4_PREPARE } from '../../js/GS4/Prepare';

// 從原始資料夾結構 弄成可以工作的樣子
const Prepare = ():Task => {
    const sortjob:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LUA,
        script: FUNIQUE_GS4_PREPARE,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const createdir:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%root%/%after%/GOP_20_I"],
        number_args: [],
        boolean_args: []
    }
    const createdir2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%root%/%after%/liar"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Sorting Stage",
        description: "From source data to prepare data",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            sortjob,
            createdir,
            createdir2
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_Generate_Prepare = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        title: "GS4 Basic Parameter",
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task = [
        Prepare(),
    ]
    return r;
}