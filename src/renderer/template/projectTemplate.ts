import { TemplateGroup, TemplateGroup2 } from '../interface'
import { GetDefaultProject_Parameter } from './parameter/Default'
import { GetFUNIQUE_GS4Project_Parameter_Builder } from './parameter/GS4'
import { GetAfterEffectTemplate } from './project/AfterEffect/Render'
import { GetBlenderTemplate } from './project/Blender/Render'
import { GetDefaultProjectTemplate } from './project/Default/Default'
import { GetFFmpeg_Image2VideoProjectTemplate } from './project/FFmpeg/I2Video'
import { GetFUNIQUE_GS4ProjectTemplate_BlendPrepare } from './project/GS4/GenerateBlendPrepare'
import { GetFUNIQUE_GS4ProjectTemplate_BlendResult } from './project/GS4/GenerateBlendResult'
import { GetFUNIQUE_GS4ProjectTemplate_Colmap } from './project/GS4/GenerateColmap'
import { GetFUNIQUE_GS4ProjectTemplate_Generate_IFrame } from './project/GS4/GenerateIFrame'
import { GetFUNIQUE_GS4ProjectTemplate_Mask } from './project/GS4/GenerateMaskedPictures'
import { GetFUNIQUE_GS4ProjectTemplate_Generate_Prepare } from './project/GS4/GeneratePrepare'
import { GetFUNIQUE_GS4ProjectTemplate_Full } from './project/GS4/GS4D_Full'
import { GetFUNIQUE_GS4ProjectTemplate_PLYOutput } from './project/GS4/OutputPly'
import { GetFUNIQUE_GS4ProjectTemplate_LUT } from './project/GS4/PlyLutConvert'

export * from './project/AfterEffect/Render'
export * from './project/Blender/Render'
export * from './project/Default/Default'
export * from './project/FFmpeg/I2Video'

export * from './project/GS4/GenerateBlendPrepare'
export * from './project/GS4/GenerateBlendResult'
export * from './project/GS4/GenerateColmap'
export * from './project/GS4/GenerateIFrame'
export * from './project/GS4/GeneratePrepare'
export * from './project/GS4/OutputPly'
export * from './project/GS4/PlyLutConvert'

const BuildIn_ProjectTempGroup:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "FFmpeg", value: 200, template: GetFFmpeg_Image2VideoProjectTemplate },
    { group: "Blender", value: 300, template: GetBlenderTemplate },
    { group: "After Effect", value: 400, template: GetAfterEffectTemplate },
]

export const ProjectTempGroup:Array<TemplateGroup> = [
    ...BuildIn_ProjectTempGroup,
    { group: "GS4D", value: 100, template: GetFUNIQUE_GS4ProjectTemplate_Full },
    { group: "GS4D", value: 101, template: GetFUNIQUE_GS4ProjectTemplate_Generate_Prepare },
    { group: "GS4D", value: 102, template: GetFUNIQUE_GS4ProjectTemplate_Colmap },
    { group: "GS4D", value: 103, template: GetFUNIQUE_GS4ProjectTemplate_Generate_IFrame },
    { group: "GS4D", value: 104, template: GetFUNIQUE_GS4ProjectTemplate_BlendPrepare },
    { group: "GS4D", value: 105, template: GetFUNIQUE_GS4ProjectTemplate_BlendResult },
    { group: "GS4D", value: 106, template: GetFUNIQUE_GS4ProjectTemplate_PLYOutput },
    { group: "GS4D", value: 107, template: GetFUNIQUE_GS4ProjectTemplate_LUT },
    { group: "GS4D", value: 108, template: GetFUNIQUE_GS4ProjectTemplate_Mask },
]

const BuildIn_ParameterTempGroup:Array<TemplateGroup2> = [
    { group: "Default", value: 0, template: GetDefaultProject_Parameter },
]

export const ParameterTempGroup:Array<TemplateGroup2> = [
    ...BuildIn_ParameterTempGroup,
    { group: "GS4D", value: 100, template: GetFUNIQUE_GS4Project_Parameter_Builder },
]