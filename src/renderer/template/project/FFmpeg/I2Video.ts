import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetFFmpegProject_Parameter } from '../../parameter/FFmpeg';

const Convert = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.LIB_COMMAND,
        script: "",
        string_args: ["ffmpeg", "-hide_banner -y -framerate %I2Video% -ss %r_start% "+
            "-i %root%/%r_src% -to %r_end% -c:v %video_encode% -b:v %video_bitrate% -crf %crf% -pix_fmt %pixel_format% "+
            "%root%/%r_output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Images to Videos",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "I2Video.data.length",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: "e_src",
                expression: "STRING(['I2Video.data.', ck, '.src'])"
            },
            {
                name: "e_start",
                expression: "STRING(['I2Video.data.', ck, '.start'])"
            },
            {
                name: "e_end",
                expression: "STRING(['I2Video.data.', ck, '.end'])"
            },
            {
                name: "e_output",
                expression: "STRING(['I2Video.data.', ck, '.output'])"
            },
            {
                name: "r_src",
                expression: "e_src",
                deep: 2
            },
            {
                name: "r_start",
                expression: "e_start",
                deep: 2
            },
            {
                name: "r_end",
                expression: "e_end",
                deep: 2
            },
            {
                name: "r_output",
                expression: "e_output",
                deep: 2
            }
        ],
        jobs: [
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