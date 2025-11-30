import { Database, DatabaseTable, Job, JobTable, Preference, Project, ProjectTable, Task, TaskTable } from "verteilen-core/src/interface"
import { Ref } from "vue"
import { Util_Server, DATA } from "."
import { BackendProxy } from "../../proxy"
import { ServerBase } from "verteilen-core/src/server"

export class ServerSave {
    server:Util_Server

    constructor(server:Util_Server) {
        this.server = server
    }

    public get static_server () : Ref<ServerBase | undefined> {
        return this.server.server
    }
    public get data () : Ref<DATA> {
        return this.server.data
    }
    public get backend () : Ref<BackendProxy> {
        return this.server.backend
    }
    public get preference () : Ref<Preference> {
        return this.server.preference
    }
    public get selectProject() {
        return this.server.selectProject
    }
    public get selectTask() {
        return this.server.selectTask
    }

    save_project = async (v:ProjectTable):Promise<void> => {
        const project:any = JSON.parse(JSON.stringify(v))
        delete project.s
        delete project.taskCount
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>((resolve) => {
            if(this.static_server.value == undefined) return
            const i = this.static_server.value.memory.projects.findIndex(x => x.uuid == project.uuid)
            if(i != -1){
                this.static_server.value.memory.projects[i] = project
            }else{
                this.static_server.value.memory.projects.push(project)
            }
            resolve()
        }) : new Promise<void>((resolve) => {
            this.backend.value.send("save_project", project.uuid, JSON.stringify(project, null, 4))
            resolve()
        })
        return p
    }

    clone_projects = async (v:Array<ProjectTable>):Promise<void> => {
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>(async (resolve) => {
            if(this.static_server.value == undefined) return
            await this.static_server.value.module_project.CloneProjects(v.map(x => x.uuid))
            await this.server.query.load_all_project()
            resolve()
        }) : new Promise<void>(async (resolve) => {
            await this.backend.value.invoke("project_module:clone_projects", ...v.map(x => x.uuid))
            await this.server.query.load_all_project()
            resolve()
        })
        return p
    }

    save_task = async (v:TaskTable):Promise<void> => {
        const task:any = JSON.parse(JSON.stringify(v))
        delete task.s
        delete task.jobCount
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>((resolve) => {
            if (process.env.NODE_ENV == 'development') console.log("Save task in web space")
            if(this.static_server.value == undefined) {
                resolve()
                return
            }
            const i = this.static_server.value.memory.tasks.findIndex(x => x.uuid == task.uuid)
            if(i != -1){
                this.static_server.value.memory.tasks[i] = task
            }else{
                this.static_server.value.memory.tasks.push(task)
            }
            resolve()
        }) :
        new Promise<void>((resolve) => {
            if (process.env.NODE_ENV == 'development') console.log("Save task in backend space")
            this.backend.value.send("save_task", task.uuid, JSON.stringify(task, null, 4))
            resolve()
        })
        return p.catch(err => console.error(err))
    }

    clone_tasks = (v:Array<TaskTable>) => {
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>(async (resolve) => {
            if(this.static_server.value == undefined) return
            const xs = await this.static_server.value.module_project.CloneTasks(v.map(x => x.uuid))
            if(this.selectProject.value != undefined){
                this.selectProject.value.tasks_uuid.push(...xs)
                await this.server.save.save_project(this.selectProject.value)
                await this.server.query.load_tasks(this.selectProject.value.uuid)
            }
            resolve()
        }) : new Promise<void>(async (resolve) => {
            const xs = await this.backend.value.invoke("project_module:clone_tasks", ...v.map(x => x.uuid))
            if(this.selectProject.value != undefined){
                this.selectProject.value.tasks_uuid.push(...xs)
                console.log(this.selectProject.value)
                await this.server.save.save_project(this.selectProject.value)
                await this.server.query.load_tasks(this.selectProject.value.uuid)
            }
            resolve()
        })
        return p
    }

    save_job = async (v:JobTable):Promise<void> => {
        const job:any = JSON.parse(JSON.stringify(v))
        delete job.s
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>((resolve) => {
            if(this.static_server.value == undefined) {
                resolve()
                return
            }
            const i = this.static_server.value.memory.jobs.findIndex(x => x.uuid == job.uuid)
            if(i != -1){
                this.static_server.value.memory.jobs[i] = job
            }else{
                this.static_server.value.memory.jobs.push(job)
            }
            resolve()
        }) :
        new Promise<void>((resolve) => {
            this.backend.value.send("save_job", job.uuid, JSON.stringify(job, null, 4))
            resolve()
        })
        return p
    }

    clone_jobs = (v:Array<JobTable>) => {
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>((resolve) => {
            if(this.static_server.value == undefined) return
            this.static_server.value.module_project.CloneJobs(v.map(x => x.uuid)).then(async xs => {
                if(this.selectTask.value){
                    this.selectTask.value.jobs_uuid.push(...xs)
                    await this.server.save.save_task(this.selectTask.value)
                    await this.server.query.load_jobs(this.selectTask.value.uuid)
                }
                resolve()
            })
        }) : new Promise<void>((resolve) => {
            this.backend.value.invoke("project_module:clone_jobs", v.map(x => x.uuid)).then(async (xs:Array<string>) => {
                if(this.selectTask.value){
                    this.selectTask.value.jobs_uuid.push(...xs)
                    await this.server.save.save_task(this.selectTask.value)
                    await this.server.query.load_jobs(this.selectTask.value.uuid)
                }
                resolve()
            })
        })
        return p
    }

    save_database = async (v:DatabaseTable):Promise<void> => {
        const database:any = JSON.parse(JSON.stringify(v))
        delete database.s
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>((resolve) => {
            if(this.static_server.value == undefined) {
                resolve()
                return
            }
            const i = this.static_server.value.memory.database.findIndex(x => x.uuid == database.uuid)
            if(i != -1){
                this.static_server.value.memory.database[i] = database
            }else{
                this.static_server.value.memory.database.push(database)
            }
            resolve()
        }) :
        new Promise<void>((resolve) => {
            this.backend.value.send("save_database", database.uuid, JSON.stringify(database, null, 4))
            resolve()
        })
        return p
    }
}