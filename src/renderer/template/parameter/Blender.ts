import { ParameterContainer, DataType } from "../../interface"

export const GetBlenderProject_Parameter = ():ParameterContainer[] => {
    return [
        { name: "project", value: "C:\\project\\file.blender", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "output", value: "C:\\project\\output\\frame_#####", type: DataType.String, runtimeOnly: false, hidden: false },

        { name: "debug", value: true, type: DataType.Boolean, runtimeOnly: false, hidden: false },
        { name: "background", value: true, type: DataType.Boolean, runtimeOnly: false, hidden: false },
        { name: "animation", value: true, type: DataType.Boolean, runtimeOnly: false, hidden: false },
        { name: "core", value: 4, type: DataType.Number, runtimeOnly: false, hidden: false },

        { name: "thread", value: 0, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "frame", value: 1, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "format", value: "OPEN_EXR", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "engine", value: "CYCLES", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "b1", value: false, type: DataType.Boolean, runtimeOnly: false, hidden: false },
        { name: "e1", value: 0, meta: "n1 + n2", type: DataType.Expression, runtimeOnly: false, hidden: false },
    ]
}