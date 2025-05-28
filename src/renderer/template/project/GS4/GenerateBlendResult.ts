import { v6 as uuidv6 } from 'uuid';
import { Task, Job, JobCategory, JobType, Project, Parameter } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';

const Checkpoint_Position = ():Task => {
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
        title: "Blend (Positive)",
        description: "Generate checkpoint folders",
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
const Checkpoint_Negative = ():Task => {
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
        title: "Blend (Negative)",
        description: "Generate checkpoint folders",
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

export const GetFUNIQUE_GS4ProjectTemplate_BlendResult = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Blend Prepare",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task.push(...[
        Checkpoint_Position(),
        Checkpoint_Negative(),
    ])
    return r
}