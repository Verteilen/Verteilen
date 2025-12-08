import { v6 as uuidv6 } from 'uuid';
import { JobTable, Property, ProjectTable, TaskTable, DatabaseTable, Library, TaskBase, JobCategory, TaskLogicType, TaskLogic, TaskLogicUnit } from "verteilen-core/dist/interface"
import { ComputedRef, Ref } from "vue"
import { i18n } from "../../plugins/i18n"

//#region Data Structure
/**
 * **Logic View Node**\
 * The logic will transform into view node first\
 * Then after finish editing, it will return to logic node.
 */
export interface ViewTreeNode {
    /**
     * **Container id**
     */
    id: string
    /**
     * **Title label**
     */
    title: string
    /**
     * **Container Type**
     */
    type: TaskLogicType
    /**
     * **Job UUID**
     */
    job_uuid: string
    /**
     * **Is Fold Open**
     */
    open?: boolean
    /**
     * **Can be drag around**
     */
    disabled?: boolean
    /**
     * **Children Children View Node**
     */
    children?: Array<ViewTreeNode>
}
/**
 * ***Page Data**
 */
export interface DATA {
    page: number
    createModal: boolean
    createType: JobCategory
    createData: JobTable
    editMode: boolean
    conditionModal: boolean
    deleteModal: boolean
    deleteData: string
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
//#endregion

export class Util_Job {
    data: Ref<DATA>
    emits: EmitType
    properties: ComputedRef<Property[] | undefined>
    items: ComputedRef<JobTable[]>

    constructor(
        data: Ref<DATA>,
        emits: EmitType,
        properties: ComputedRef<Property[] | undefined>,
        items: ComputedRef<JobTable[]>,
    ){
        this.data = data
        this.emits = emits
        this.properties = properties
        this.items = items
    }

    //#region Page Utility
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
        if(this.data.value.buffer == undefined) return
        if(this.data.value.buffer.logic != undefined){
            this.data.value.buffer.logic.group = this.data.value.logicBuffer.map(x => {
                return this.viewNodeToLogic(x)
            })
        }
        this.emits('taskSubmit', this.data.value.buffer)
        this.data.value.dirty = false
    }
    //#endregion

    //#region Logic Drag Event
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
        this.save()
    }
    tree_delete_id = (id:string) => {
        const deleteJobsUUID:Array<string> = []
        const container = this.tree_find_id_target(id, this.data.value.logicBuffer)
        if(container == undefined) {
            console.warn(`Cannot find id from logic tree: ${id}`)
            return
        }
        const r = container[1] == undefined ? this.data.value.logicBuffer : container[1]?.children!
        const index = r.findIndex(x => x.id == id)
        r.splice(index, 1)
        this.tree_get_job_uuid(deleteJobsUUID, container[0])
        this.emits('delete', deleteJobsUUID)
        this.save()
    }
    /**
     * Get the [container, container parent] object from the logic tree.
     * @param id Search ID
     * @param root Root list
     * @param parent register parent object
     * @returns [Container, Container Parent]\
     * If containre parent is undefined, it means container is store at top layer
     */
    tree_find_id_target = (id:string, root:Array<ViewTreeNode>, parent?:ViewTreeNode):[ViewTreeNode, ViewTreeNode | undefined] | undefined=> {
        for(let x of root){
            if(x.id == id) return [x, parent]
            if(x.children == undefined) continue
            const a = this.tree_find_id_target(id, x.children, x)
            if(a != undefined) return a
        }
    }
    /**
     * Accumulate all job uuid from a tree object
     * @param list Accumulate list
     * @param root Top node target
     */
    tree_get_job_uuid = (list:Array<string>, root:ViewTreeNode) => {
        if(root.job_uuid.length > 1){
            list.push(root.job_uuid)
        }
        if(root.children != undefined){
            for(let x of root.children){
                this.tree_get_job_uuid(list, x)
            }
        }
    }
    //#endregion

    //#region Property Event
    /**
     * **Property Create Blank Event**
     */
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
    /**
     * **Property Delete Event**
     * @param name Porperty name
     */
    pdelete = (name:string) => {
        if(this.data.value.buffer == undefined) return
        const index = this.data.value.buffer.properties.findIndex(x => x.name == name)
        if(index == -1) return
        this.data.value.buffer.properties.splice(index, 1)
        this.dirty()
    }
    /**
     * **Property Drag Move Event**
     * @param e Event
     */
    pmove = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    /**
     * **Property Drag End Event**
     * @param e Event
     */
    pend = (e:any) => {
        if(this.data.value.buffer == undefined) return
        const n:number = e.newIndex
        const o:number = e.oldIndex
        const buffer = this.data.value.buffer.properties.splice(o, 1)
        this.data.value.buffer.properties.splice(n, 0, ...buffer)
        this.save()
    }
    //#endregion

    //#region Logic Utility Function
    viewNodeToLogic = (node:ViewTreeNode):TaskLogicUnit => {
        return {
            uuid: node.id,
            type: node.type,
            job_uuid: node.job_uuid,
            children: node.children?.map(x => this.viewNodeToLogic(x)) ?? []
        }
    }

    createConditionNode = (type:TaskLogicType):TaskLogicUnit | undefined => {
        if(type == TaskLogicType.GROUP){
            return {
                uuid: uuidv6(),
                type: TaskLogicType.GROUP,
                job_uuid: undefined,
                children: [
                    {
                        uuid: uuidv6(),
                        type: TaskLogicType.CONDITION,
                        job_uuid: undefined,
                        children: []
                    },
                    {
                        uuid: uuidv6(),
                        type: TaskLogicType.EXECUTION,
                        job_uuid: undefined,
                        children: []
                    },
                    {
                        uuid: uuidv6(),
                        type: TaskLogicType.FAILED,
                        job_uuid: undefined,
                        children: []
                    }
                ]
            }
        }
        else if(type == TaskLogicType.AND || type == TaskLogicType.NOT || type == TaskLogicType.OR){
            return {
                uuid: uuidv6(),
                type: type,
                job_uuid: '',
                children: []
            }
        }
        else return undefined
    }
    conditionTypeDragEnable = (type:TaskLogicType):boolean => {
        switch(type){
            case TaskLogicType.CONDITION:
            case TaskLogicType.EXECUTION:
            case TaskLogicType.FAILED:
                return false
            default:
                return true 
        }
    }
    /**
     * Logic tree convertsion => tree node
     * @param unit Tree unit
     * @returns Node structure
     */
    convert = (unit:TaskLogicUnit):ViewTreeNode => {
        return {
            id: unit.uuid,
            job_uuid: unit.job_uuid ?? "",
            type: unit.type,
            title: `${unit.type}`,
            disabled: this.conditionTypeDragEnable(unit.type),
            children: unit.children.map(x => this.convert(x))
        }
    }
    /**
     * UUIDs convertsion => tree node
     * @param uuid job_uuid
     * @returns Node structure
     */
    convert2 = (uuid:string):ViewTreeNode => {
        return {
            id: uuidv6(),
            job_uuid: uuid,
            type: TaskLogicType.SINGLE,
            title: this.items.value?.find(x => x.uuid == uuid)?.title ?? ""
        }
    }
    //#endregion
}