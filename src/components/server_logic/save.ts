import { DatabaseTable, JobTable, Preference, ProjectTable, TaskTable } from "verteilen-core/dist/interface"
import { Ref } from "vue"
import { Util_Server, DATA } from "."
import { BackendProxy } from "../../proxy"

export class ServerSave {
    server:Util_Server

    constructor(server:Util_Server) {
        this.server = server
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
        const p = new Promise<void>((resolve) => {
            if (process.env.NODE_ENV == 'development') console.log("[Server:Save] Save project in backend space")
            this.backend.value.send("save_project", project.uuid, JSON.stringify(project, null, 4))
            resolve()
        })
        return p
    }

    save_task = async (v:TaskTable):Promise<void> => {
        const task:any = JSON.parse(JSON.stringify(v))
        delete task.s
        delete task.jobCount
        const p = new Promise<void>((resolve) => {
            if (process.env.NODE_ENV == 'development') console.log("[Server:Save] Save task in backend space")
            this.backend.value.send("save_task", task.uuid, JSON.stringify(task, null, 4))
            resolve()
        })
        return p.catch(err => console.error(err))
    }

    save_job = async (v:JobTable):Promise<void> => {
        const job:any = JSON.parse(JSON.stringify(v))
        delete job.s
        const p = new Promise<void>((resolve) => {
            if (process.env.NODE_ENV == 'development') console.log("[Server:Save] Save job in backend space")
            this.backend.value.send("save_job", job.uuid, JSON.stringify(job, null, 4))
            resolve()
        })
        return p
    }

    clone_projects = async (v:Array<ProjectTable>):Promise<void> => {
        const p = new Promise<void>(async (resolve) => {
            await this.backend.value.invoke("project_module:clone_projects", ...v.map(x => x.uuid))
            await this.server.query.load_all_project()
            resolve()
        })
        return p
    }

    clone_tasks = (v:Array<TaskTable>) => {
        const p = new Promise<void>(async (resolve) => {
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

    clone_jobs = (v:Array<JobTable>) => {
        const p = new Promise<void>((resolve) => {
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
        const p = new Promise<void>((resolve) => {
            this.backend.value.send("save_database", database.uuid, JSON.stringify(database, null, 4))
            resolve()
        })
        return p
    }
}