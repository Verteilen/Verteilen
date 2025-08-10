import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Project, Parameter, Task } from '../../../interface';
import { GetFFmpegProject_Parameter } from '../../parameter/FFmpeg';

const Download = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LIB_COMMAND,
        script: "",
        string_args: ["ffmpeg", "-hide_banner -y -i %download.src% "+
            "-c:v copy -c:a copy %root%/%download.output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Download video to source",
        description: "",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            render
        ]
    }
    return t
}

export const GetFFmpeg_ProjectTemplate_Download = (r:Project):Project => {
    const para:Parameter = {
        title: "FFmpeg Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFFmpegProject_Parameter()
    }
    r.parameter = para
    r.task.push(...[
        Download(),
    ])
    return r
}