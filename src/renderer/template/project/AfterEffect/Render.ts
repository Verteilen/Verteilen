import { v6 as uuidv6 } from 'uuid';
import { Database, Project } from "../../../interface";

export const GetAfterEffectTemplate = (r:Project):Project => {
    const para:Database = {
        title: "AfterEffect Database",
        uuid: uuidv6(),
        canWrite: true,
        containers: []
    }
    r.database = para
    r.task = [

    ]
    return r
}