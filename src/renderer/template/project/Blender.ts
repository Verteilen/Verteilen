import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";

const GetBlenderTemplate_Render = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["", "blender", "-b %file% -s %ck% -e %ck% -F %format% -o %output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Render frame one by one",
        description: "",
        setupjob: false,
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            render
        ]
    }
    return t
}

export const GetBlenderTemplate = (r:Project):Project => {
    const para:Parameter = {
        title: "Blender Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: [
            { name: "frameCount", value: 20, type: DataType.Number, runtimeOnly: false, hidden: false },

            { name: "file", value: "G:/Developer/Funique/Blender/Test/project.blend", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "output", value: "G:/Developer/Funique/Blender/Test/out", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "format", value: "PNG", type: DataType.String, runtimeOnly: false, hidden: false },
        ]
    }
    r.parameter = para
    r.task = [
        GetBlenderTemplate_Render()
    ]
    return r
}