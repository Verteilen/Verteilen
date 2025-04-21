import { v6 as uuidv6 } from 'uuid';
import { DataType, Job, JobCategory, JobType, Parameter, Project, Task } from "../../interface";

const GetFFmpeg_Image2VideoProjectTemplate_Render = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["", "blender", "-b %file% -s %ck% -e %ck% -F %format% -o %output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Render frame one by one",
        description: "",
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

const GetFFmpeg_Image2VideoProjectTemplate_Concat = ():Task => {
    const render:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        lua: "",
        string_args: ["", "blender", "-b %file% -s %ck% -e %ck% -F %format% -o %output%"],
        number_args: [],
        boolean_args: []
    }
    const t:Task = {
        uuid: uuidv6(),
        title: "Render frame one by one",
        description: "",
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

export const GetFFmpeg_Image2VideoProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        canWrite: true,
        containers: [
            { name: "FPS", value: 30, type: DataType.Number, runtimeOnly: false, hidden: false },
            
            { name: "root", value: "G:/Developer/Funique/image2video/Test", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "output", value: "G:/Developer/Funique/Blender/Test/out", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "format", value: "PNG", type: DataType.String, runtimeOnly: false, hidden: false },
        ]
    }
    r.parameter = para
    r.task.push(...[
        GetFFmpeg_Image2VideoProjectTemplate_Render(),
        GetFFmpeg_Image2VideoProjectTemplate_Concat(),
    ])
    return r
}