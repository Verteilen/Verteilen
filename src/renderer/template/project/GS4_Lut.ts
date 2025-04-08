import { DataType, Parameter, Project } from "../../interface"

export const GetFUNIQUE_GS4LUTProjectTemplate = (r:Project):Project => {
    const para:Parameter = {
        canWrite: true,
        containers: [
            { name: "root", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "output", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
            { name: "lut", value: "", type: DataType.String, runtimeOnly: false, hidden: false },
        ]
    }
    r.parameter = para
    r.task.push(...[

    ])
    return r
}