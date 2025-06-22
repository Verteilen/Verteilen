import { DataType, ParameterContainer } from "../../interface"

export const GetFFmpegProject_Parameter = ():ParameterContainer[] => {
    return [
        { name: "src_download", value: '', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "src", value: '', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "output", value: '', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "encode", value: 'h264', type: DataType.String, runtimeOnly: false, hidden: false },
    ]
}