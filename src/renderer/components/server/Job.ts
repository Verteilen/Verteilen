import { v6 as uuidv6 } from 'uuid';
import { JobTable, Property, ProjectTable, TaskTable, DatabaseTable, Library, TaskBase, JobCategory, TaskLogicType, TaskLogic, TaskLogicUnit } from "verteilen-core/dist/interface"
import { ComputedRef, Ref } from "vue"
import { i18n } from "../../plugins/i18n"

export interface ViewTreeNode {
    open?: boolean
    type: TaskLogicType
    id: string
    title: string
    children?: Array<ViewTreeNode>
}

export interface DATA {
    page: number
    createModal: boolean
    createType: JobCategory
    createData: JobTable
    editMode: boolean
    conditionModal: boolean
    deleteModal: boolean
    deleteData: Array<string>
    selection: Array<string>
    buffer: TaskBase | undefined
    types: Array<any>
    types2: Array<any>
    categorise: Array<any>
    result: Array<any>
    dirty: boolean
    pfields: Array<any>
    errorMessage: string
    titleError: boolean
    dragging: boolean
    logicBuffer: Array<ViewTreeNode>
}

export interface PROPS {
    projects: Array<ProjectTable>
    jobs: Array<JobTable>
    select: TaskTable | undefined
    owner: ProjectTable | undefined
    database: DatabaseTable | undefined
    libs: Array<Library>
}

export type EmitType = {
    (e: 'added', job:JobTable): void
    (e: 'save', job:JobTable): void
    (e: 'clone', job:JobTable): void
    (e: 'edit', job:JobTable): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void

    (e: 'taskSubmit', data:TaskBase): void
    (e: 'return'): void
}

export class Util_Job {
    data: Ref<DATA>
    emits: EmitType
    properties: ComputedRef<Property[] | undefined>

    constructor(
        data: Ref<DATA>,
        emits: EmitType,
        properties: ComputedRef<Property[] | undefined>
    ){
        this.data = data
        this.emits = emits
        this.properties = properties
    }

    jobCreate = (job:JobTable):JobTable | undefined => {
        if(job.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        return {
            ...job,
            uuid: uuidv6()
        }
    }

    dirty = () => {
        this.data.value.dirty = true
    }
    save = () => {
        this.p_submit()
        this.data.value.dirty = false
    }
    move = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    start = (e:any) => {
        this.data.value.dragging = true
    }
    end = (e:any) => {
        this.data.value.dragging = false
        if(this.data.value.buffer == undefined) return
        //const uuids = this.tasks.value.map(x => x.uuid)
        const n:number = e.newIndex
        const o:number = e.oldIndex
        const buffer = this.data.value.buffer.jobs_uuid.splice(o, 1)
        this.data.value.buffer.jobs_uuid.splice(n, 0, ...buffer)
        this.p_submit()
    }
    tmove = (e:any, oge:any) => {
        console.log("MOVE", e, oge)
    }
    tstart = (e:any) => {
        this.data.value.dragging = true
        console.log("START", e)
    }
    tend = (e:any) => {
        this.data.value.dragging = false
        if(this.data.value.buffer == undefined) return
        const n:number = e.newIndex
        const o:number = e.oldIndex
        //this.data.value.buffer.logic?.group
        this.p_submit()
    }

    pcreateProperty = () => {
        const p:Property = {
            name: "Default_Property",
            expression: "1 + 1",
            deep: 1
        }
        let count:number = 0
        while(this.data.value.buffer?.properties.find(x => x.name == p.name)){
            count = count + 1
            p.name = `Default_Property_${count}`
        }
        this.data.value.buffer?.properties.push(p)
        this.dirty()
    }
    p_submit = () => {
        if(this.data.value.buffer == undefined) return
        if(this.data.value.buffer.logic != undefined){
            this.data.value.buffer.logic.group = this.data.value.logicBuffer.map(x => {
                return this.viewNodeToLogic(x)
            })
        }
        this.emits('taskSubmit', this.data.value.buffer)
    }
    pdelete = (name:string) => {
        if(this.data.value.buffer == undefined) return
        const index = this.data.value.buffer.properties.findIndex(x => x.name == name)
        if(index == -1) return
        this.data.value.buffer.properties.splice(index, 1)
        this.dirty()
    }
    pmove = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    pend = (e:any) => {
        if(this.data.value.buffer == undefined) return
        const n:number = e.newIndex
        const o:number = e.oldIndex
        const buffer = this.data.value.buffer.properties.splice(o, 1)
        this.data.value.buffer.properties.splice(n, 0, ...buffer)
        this.p_submit()
    }

    //#region Logic
    viewNodeToLogic = (node:ViewTreeNode):TaskLogicUnit => {
        return {
            type: node.type,
            job_uuid: node.id,
            children: node.children?.map(x => this.viewNodeToLogic(x)) ?? []
        }
    }
}