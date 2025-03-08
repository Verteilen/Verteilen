import { Parameter, Project } from "../../interface"

export const GetAfterEffectTemplate = (r:Project):Project => {
    const para:Parameter = {
        numbers: [

        ],
        strings: [

        ],
        booleans: [

        ],
    }
    r.parameter = para
    r.task = [

    ]
    return r
}