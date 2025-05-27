import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, Parameter, Project } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter } from '../../parameter/GS4';

export const GetFUNIQUE_GS4ProjectTemplate_IFrame = ():Task => {
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%videogs%", "conda", "run --no-capture-output -n %conda_env% python train_sequence_Good_Full_Train_densify_until_2000_i7000.py --density %density_util% --start %gap_value% --end %gap_value_two% --iframe 1 --data %root%/%before% --output %root%/%after%/GOP_20_I --interval %iframe_gap% --group_size 1 --iteration %iframe_iteration% --gtp %gtp% --dynamic %finetune_iteration% %train_command%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "生成 I Frame",
        description: "生成完整 Frame",
        setupjob: false,
        cronjob: true,
        cronjobKey: "iframe_size",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + 1'
            },
            {
                name: 'gap_value_two',
                expression: '(ck - 1) * iframe_gap + 2'
            },
            {
                name: 'gap_value_end',
                expression: '(ck - 1) * iframe_gap + 3'
            }
        ],
        jobs: [
            command1
        ]
    }
    return t
}

// 把渣渣刪掉 !
export const GetFUNIQUE_GS4ProjectTemplate_Denoise = ():Task => {
    const renamee:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.RENAME,
        script: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%gap_value%/point_cloud/iteration_%iframe_iteration%/point_cloud.ply", "%root%/%after%/GOP_20_I/checkpoint/%gap_value%/point_cloud/iteration_%iframe_iteration%/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%gap_value%/point_cloud/iteration_%iframe_iteration%", "ply_denoise", "-i point_cloud_before.ply -o point_cloud.ply -r %denoise% -g %denoise% -b %denoise%"],
        number_args: [],
        boolean_args: []
    }
    const deleted:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.DELETE_FILE,
        script: "",
        string_args: ["%root%/%after%/GOP_20_I/checkpoint/%gap_value%/point_cloud/iteration_%iframe_iteration%/point_cloud_before.ply"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "降躁處理",
        description: "把渣渣刪掉 !",
        setupjob: false,
        cronjob: true,
        cronjobKey: "iframe_size",
        multi: true,
        multiKey: "core",
        properties: [
            {
                name: 'gap_value',
                expression: '(ck - 1) * iframe_gap + 1'
            }
        ],
        jobs: [
            renamee,
            command1,
            deleted
        ]
    }
    return t
}

// 備份 I-Frame
export const GetFUNIQUE_GS4ProjectTemplate_IFrameBackup = ():Task => {
    const backup:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COPY_DIR,
        script: "",
        string_args: ["%root%/%after%/GOP_20_I", "%root%/%after%/GOP_20_I_Backup"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "備份 I Frame",
        description: "將剛完成的 IFrame 進行備份處理",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            backup
        ]
    }
    return t
}


export const GetFUNIQUE_GS4ProjectTemplate_Generate_IFrame = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        title: "GS4 Basic Parameter",
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter()
    }
    r.parameter = para
    r.task = [
        GetFUNIQUE_GS4ProjectTemplate_IFrame(),
        GetFUNIQUE_GS4ProjectTemplate_Denoise(),
        GetFUNIQUE_GS4ProjectTemplate_IFrameBackup(),
    ]
    return r;
}