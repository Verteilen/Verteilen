import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Database, Project, Task, CreateDefaultTask, CreateDefaultJob } from "../../../interface";
import { GetBlenderProject_Database } from '../../database/Blender';

const Render = ():Task => {
    const render:Job = {
        ...CreateDefaultJob(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        string_args: ["", "blender", "-b %project% %_a% %_s% %_e% -E %engine% -F %format% -t %thread% --log-level %log% -o %output%"],
    }
    const t:Task = {
        ...CreateDefaultTask(),
        title: "Single Node Render",
        properties: [
            {
                name: "_a",
                expression: "IF(animation, \"-a\", \"\")"
            },
            {
                name: "_s",
                expression: "IF(animation, \"\", STRING([\"-s \", start]))"
            },
            {
                name: "_e",
                expression: "IF(animation, \"\", STRING([\"-s \", end]))"
            }
        ],
        jobs: [
            render
        ]
    }
    return t
}

export const GetBlenderSingleTemplate = (r:Project):Project => {
    const para:Database = {
        title: "Blender Database",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetBlenderProject_Database()
    }
    r.database = para
    r.tasks = [
        Render()
    ]
    return r
}