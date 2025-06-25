import { ParameterContainer, DataType } from "../../interface"

export const GetDefaultProject_Parameter = ():ParameterContainer[] => {
    return [
        { name: "path", value: "C:\\Tool", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "cluster", value: 15, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "core", value: 4, type: DataType.Number, runtimeOnly: false, hidden: false },

        { name: "n1", value: 9999, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "s1", value: "Hello World", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "b1", value: false, type: DataType.Boolean, runtimeOnly: false, hidden: false },
        { name: "e1", value: 0, meta: "n1 + n2", type: DataType.Expression, runtimeOnly: false, hidden: false },
    ]
}