import { TemplateGroup, TemplateGroup2 } from '../interface'
import { GetDefaultProject_Parameter } from './parameter/Default'
import { GetAfterEffectTemplate } from './project/AfterEffect/Render'
import { GetBlenderTemplate } from './project/Blender/Render'
import { GetDefaultProjectTemplate } from './project/Default/Default'
import { GetFFmpeg_Image2VideoProjectTemplate } from './project/FFmpeg/I2Video'

export * from './project/AfterEffect/Render'
export * from './project/Blender/Render'
export * from './project/Default/Default'
export * from './project/FFmpeg/I2Video'

export const BuildIn_ProjectTempGroup:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "FFmpeg", value: 200, template: GetFFmpeg_Image2VideoProjectTemplate },
    { group: "Blender", value: 300, template: GetBlenderTemplate },
    { group: "After Effect", value: 400, template: GetAfterEffectTemplate },
]

export const BuildIn_ParameterTempGroup:Array<TemplateGroup2> = [
    { group: "Default", value: 0, template: GetDefaultProject_Parameter },
]