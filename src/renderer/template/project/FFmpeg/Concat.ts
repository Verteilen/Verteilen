import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetFFmpegProject_Parameter } from '../../parameter/FFmpeg';
import { FFMPEG_CONCAT_SCRIPT } from '../../js/ffmpeg/Concat';

const Convert = ():Task => {
    const concatfile:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: FFMPEG_CONCAT_SCRIPT,
        string_args: [],
        number_args: [],
        boolean_args: []
    }
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LIB_COMMAND,
        script: "",
        string_args: ["ffmpeg", "-f concat -safe 0 -i %root%/concat.txt -c copy %root%/%Concat.output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Concat videos to a single video",
        description: "",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            concatfile,
            render
        ]
    }
    return t
}

export const GetFFmpeg_ProjectTemplate_Image2Video = (r:Project):Project => {
    const para:Parameter = {
        title: "FFmpeg Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFFmpegProject_Parameter()
    }
    r.parameter = para
    r.task.push(...[
        Convert(),
    ])
    return r
}