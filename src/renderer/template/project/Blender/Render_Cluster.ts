import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Database, Project, Task } from "../../../interface";
import { Blender_GetClusterCount } from '../../js/blender/Cluster.Count';
import { GetBlenderProject_Database } from '../../database/Blender';


const Cluster = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.JAVASCRIPT,
        script: Blender_GetClusterCount,
        string_args: [""],
        number_args: [],
        boolean_args: [],
        id_args: [],
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Cluster Render",
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

const Render = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "blender", "-b %project% -E %engine% -f %_f% -F %format% -t %thread% --log-level %log% -o %output%"],
        number_args: [],
        boolean_args: [],
        id_args: [],
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Cluster Render",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "cluster",
        multi: false,
        multiKey: "",
        properties: [
            {
                name: "_f",
                expression: "ck + start"
            }
        ],
        jobs: [
            render
        ]
    }
    return t
}

export const GetBlenderClusterTemplate = (r:Project):Project => {
    const para:Database = {
        title: "Blender Database",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetBlenderProject_Database()
    }
    r.database = para
    r.task = [
        Cluster(),
        Render(),
    ]
    return r
}