import { TemplateGroup, TemplateGroup2 } from '../interface'
import { GetDefaultProject_Parameter } from './parameter/Default'
import { GetFFmpegProject_Parameter } from './parameter/FFmpeg'
import { GetAfterEffectTemplate } from './project/AfterEffect/Render'
import { GetBlenderClusterTemplate } from './project/Blender/Render_Cluster'
import { GetBlenderSingleTemplate } from './project/Blender/Render_Single'
import { GetDefaultProjectTemplate } from './project/Default/Default'
import { GetFFmpeg_DownloadProjectTemplate } from './project/FFmpeg/Download'
import { GetFFmpeg_Image2VideoProjectTemplate } from './project/FFmpeg/I2Video'

export * from './project/AfterEffect/Render'
export * from './project/Blender/Render_Single'
export * from './project/Blender/Render_Cluster'
export * from './project/Default/Default'
export * from './project/FFmpeg/I2Video'

export const BuildIn_ProjectTempGroup:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "FFmpeg", value: 200, template: GetFFmpeg_Image2VideoProjectTemplate },
    { group: "FFmpeg", value: 201, template: GetFFmpeg_DownloadProjectTemplate },
    { group: "Blender", value: 300, template: GetBlenderSingleTemplate },
    { group: "Blender", value: 301, template: GetBlenderClusterTemplate },
    { group: "After Effect", value: 400, template: GetAfterEffectTemplate },
]

export const BuildIn_ParameterTempGroup:Array<TemplateGroup2> = [
    { group: "Default", title: 'Default Parameter', value: 0, template: GetDefaultProject_Parameter },
    { group: "FFmpeg", title: 'FFmpeg Parameter', value: 200, template: GetFFmpegProject_Parameter },
]