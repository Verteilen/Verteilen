import { ParameterContainer, DataType } from "../../interface"

export const GetFUNIQUE_GS4Project_Parameter_Builder = ():ParameterContainer[] => {
    return [
        { name: "frameCount", value: 50, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "iframe_gap", value: 3, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "core", value: 5, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "blend", value: 5, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "contribute", value: 1, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "iframe_size", value: 17, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "denoise", value: 0, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "density_util", value: 2000, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "iframe_iteration", value: 7000, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "finetune_iteration", value: 500, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "gtp", value: 500, type: DataType.Number, runtimeOnly: false, hidden: false },

        { name: "group_size", value: 15, meta: "iframe_gap * blend", type: DataType.Expression, runtimeOnly: false, hidden: true },

        { name: "root", value: "G:/Developer/Funique/4DGS/Test", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "output", value: "G:/Developer/Funique/4DGS/Test/out", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "prepare", value: "Prepare", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "before", value: "before", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "after", value: "after", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "CAM", value: "CAM", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "unmask", value: "unmask", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "mask", value: "mask", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "images", value: "images", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "sparse", value: "sparse", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "train_command", value: "--resolution 1 --cuda 0 --sh 3 --interval 1", type: DataType.String, runtimeOnly: false, hidden: false },

        { name: "train_script", value: "train_sequence_Good_Full_Train_densify_until_2000_i7000.py", type: DataType.String, runtimeOnly: false, hidden: true },
        { name: "iframe_env_folder", value: "C:/videogs/VideoGS", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "iframe_env", value: "videogs", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "middle_env_folder", value: "C:/videogs/VideoGS", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "middle_env", value: "videogs", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "mask_env_folder", value: "C:/videogs/VideoGS", type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "mask_env", value: "videogs", type: DataType.String, runtimeOnly: false, hidden: false },
    ]
}