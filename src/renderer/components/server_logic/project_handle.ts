import { Emitter } from "mitt";
import { nextTick, Ref } from "vue";
import { BusType, Project } from "../../interface";
import { config_getter, DATA, save_and_update } from ".";

export class Util_Server_Project {
    data:Ref<DATA>
    config:config_getter
    update:save_and_update
    updateOnly:save_and_update
    emitter:Emitter<BusType>

    constructor (_data:Ref<DATA>, _config:config_getter, _updateOnly:save_and_update, _update:save_and_update, _emitter:Emitter<BusType>){
        this.data = _data
        this.config = _config
        this.updateOnly = _updateOnly
        this.update = _update
        this.emitter = _emitter
    }

    addProject = (v:Array<Project>) => {
        v.forEach(x => {
            if(x.database == undefined){
                this.data.value.projects.push(x)
            }else{
                this.data.value.databases.push(x.database)
                x.database_uuid = x.database.uuid
                this.data.value.projects.push(x)
            }
        })
        this.update()
        this.data.value.page = 0
    }
    
    editProject = (id:string, v:Project) => {
        const selectp = this.data.value.projects.findIndex(x => x.uuid == id)
        if(selectp == -1) return
        this.data.value.projects[selectp] = v
        if(this.data.value.selectProject?.uuid == id){
            this.data.value.selectProject = v
        }
        this.update()
    }
    
    deleteProject = (uuids:Array<string>, bind:boolean) => {
        uuids.forEach(id => {
            const index = this.data.value.projects.findIndex(x => x.uuid == id)
            if(index != -1) {
                const target = this.data.value.projects[index]
                target.task.forEach(tid => {
                    if(this.data.value.selectTask?.uuid == tid.uuid){
                        this.data.value.selectTask = undefined
                    }
                })
                this.data.value.projects.splice(index, 1)

                if(bind){
                    const index2 = this.data.value.databases.findIndex(x => x.uuid == target.database_uuid)
                    if(index2 != -1){
                        const target2 = this.data.value.databases[index2]
                        if(this.data.value.selectDatabase?.uuid == target2.uuid){
                            this.data.value.selectDatabase = undefined
                        }
                        this.data.value.databases.splice(index2, 1)
                        if(this.config().config.isElectron){
                            window.electronAPI.send('delete_database', target2.uuid)
                        }
                    }
                }
            }
            if(this.data.value.selectProject?.uuid == id){
                this.data.value.selectProject = undefined
            }
            if(this.config().config.isElectron){
                window.electronAPI.send('delete_record', id)
            }
        })
        this.update()
    }
    
    chooseProject = (uuid:string) => {
        this.data.value.selectProject = this.data.value.projects.find(x => x.uuid == uuid)
        this.data.value.page = 1
        nextTick(this.updateOnly)
    }
    
    moveupProject = (uuid:string) => {
        const index = this.data.value.projects.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.projects[index - 1]
        this.data.value.projects[index - 1] = this.data.value.projects[index]
        this.data.value.projects[index] = b
        this.update()
    }
    
    movedownProject = (uuid:string) => {
        const index = this.data.value.projects.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.projects[index + 1]
        this.data.value.projects[index + 1] = this.data.value.projects[index]
        this.data.value.projects[index] = b
        this.update()
    }
}