import { Parameter, Project } from "../../interface";

export const GetFFmpeg_Image2VideoProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        canWrite: true,
        containers: []
    }
    r.parameter = para
    r.task.push(...[

    ])
    return r
}