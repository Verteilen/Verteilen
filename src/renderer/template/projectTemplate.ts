import { TemplateGroup, TemplateGroup2 } from '../interface'
import { GetDefaultProject_Parameter } from './parameter/Default'
import { GetAfterEffectTemplate } from './project/AfterEffect/Render'
import { GetBlenderClusterTemplate } from './project/Blender/Render_Cluster'
import { GetBlenderSingleTemplate } from './project/Blender/Render_Single'
import { GetDefaultProjectTemplate } from './project/Default/Default'
import { GetDefaultProjectTemplate_Short } from './project/Default/Default_Short'

export * from './project/AfterEffect/Render'
export * from './project/Blender/Render_Single'
export * from './project/Blender/Render_Cluster'
export * from './project/Default/Default'

export const BuildIn_ProjectTempGroup:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "Default", value: 1, template: GetDefaultProjectTemplate_Short },
    { group: "Blender", value: 100, template: GetBlenderSingleTemplate },
    { group: "Blender", value: 101, template: GetBlenderClusterTemplate },
    { group: "After Effect", value: 200, template: GetAfterEffectTemplate },
]

export const BuildIn_ParameterTempGroup:Array<TemplateGroup2> = [
    { group: "Default", title: 'Default Parameter', value: 0, template: GetDefaultProject_Parameter },
]