import { Parameter, Project } from "../../interface";

export const GetFFmpeg_Image2VideoProjectTemplate = (r:Project):Project => {
const para:Parameter = {
        numbers: [

        ],
        strings: [

        ],
        booleans: [

        ],
    }
    r.parameter = para
    r.task.push(...[

    ])
    return r
}