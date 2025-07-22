import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../../interface";
import { GetBlenderProject_Parameter } from '../../parameter/Blender';

const Render = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "blender", "-b %project% %_a% %_s% %_e% -E %engine% -F %format% -t %thread% --log-level %log% -o %output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Single Node Render",
        description: "",
        setupjob: false,
        cronjob: false,
        cronjobKey: "",
        multi: false,
        multiKey: "",
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
    const para:Parameter = {
        title: "Blender Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetBlenderProject_Parameter()
    }
    r.parameter = para
    r.task = [
        Render()
    ]
    return r
}