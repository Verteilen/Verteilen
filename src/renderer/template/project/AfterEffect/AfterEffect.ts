import { v6 as uuidv6 } from 'uuid';
import { Parameter, Project } from "../../../interface";

export const GetAfterEffectTemplate = (r:Project):Project => {
    const para:Parameter = {
        title: "AfterEffect Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: []
    }
    r.parameter = para
    r.task = [

    ]
    return r
}