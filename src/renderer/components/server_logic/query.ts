import { Database, DatabaseTable, ExecutionLog, Job, JobTable, Library, Node, NodeTable, Preference, Project, ProjectTable, Task, TaskTable } from "verteilen-core/src/interface"
import { Ref } from "vue"
import { DATA, Util_Server } from "."
import { BackendProxy } from "../../proxy"
import { Server } from "verteilen-core/src/server"

export class ServerQuery {
    server:Util_Server

    constructor(server:Util_Server) {
        this.server = server
    }

    public get static_server () : Ref<Server | undefined> {
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
    public get selectProject () {
        return this.server.selectProject
    }
    public get selectTask () {
        return this.server.selectTask
    }

    load_all_project = async ():Promise<void> => {
        const p:Promise<void> = !this.backend.value.config.haveBackend ? 
        new Promise((resolve) => {
            this.data.value.projects = this.static_server.value?.memory.projects.map((x:Project):ProjectTable => {
                return {
                    ...x,
                    s: false,
                    taskCount: x.tasks_uuid.length
                }
            }) || []
            resolve()
        }) : this.backend.value.invoke('load_all_project').then((texts:Array<string>) => {
            this.data.value.projects = texts.map((y:string):ProjectTable => {
                const p:Project = JSON.parse(y)
                return {
                    ...p,
                    s: false,
                    taskCount: p.tasks_uuid.length
                }
            })
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Projects", this.data.value.projects)
        })
    }

    load_project = async (uuid:string):Promise<void> => {
        const bi = this.data.value.projects.findIndex(b => b.uuid == uuid)
        const p:Promise<void> = !this.backend.value.config.haveBackend ? 
        new Promise((resolve) => {
            const buffer:Project | undefined = this.static_server.value?.memory.projects.find(x => x.uuid == uuid)
            if(buffer != undefined){
                if(bi != -1) this.data.value.projects.splice(bi, 1)
                this.data.value.projects.push({
                    ...buffer,
                    s: false,
                    taskCount: buffer.tasks_uuid.length
                })
            }
            resolve()
        }) : this.backend.value.invoke('load_project', uuid).then((text:string) => {
            const buffer:Project | undefined = JSON.parse(text)
            if(buffer != undefined){
                if(bi != -1) this.data.value.projects.splice(bi, 1)
                this.data.value.projects.push({
                    ...buffer,
                    s: false,
                    taskCount: buffer.tasks_uuid.length
                })
            }
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Project", this.data.value.projects)
        })
    }

    load_tasks = async (uuid:string):Promise<void> => {
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>(async (resolve) => {
            if(this.static_server.value == undefined) return
            const tts = await this.static_server.value.module_project.GetProjectRelatedTask(uuid)
            this.data.value.tasks = tts.map(x => ({
                ...x,
                jobCount: x.jobs_uuid.length
            }))
            resolve()
        }) : this.backend.value.invoke(`project_module:get_tasks`, uuid).then(x => {
            const p:Array<Task> = x
            this.data.value.tasks = p.map(y => {
                return {
                    ...y,
                    jobCount: y.jobs_uuid.length,
                }
            })
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("tasks", this.selectProject.value, this.data.value.tasks)
        })
    }

    load_task = async (uuid:string):Promise<void> => {
        const bi = this.data.value.tasks.findIndex(b => b.uuid == uuid)
        const p:Promise<void> = !this.backend.value.config.haveBackend ? 
        new Promise((resolve) => {
            const buffer:Task | undefined = this.static_server.value?.memory.tasks.find(x => x.uuid == uuid)
            if(buffer != undefined){
                if(bi != -1) this.data.value.tasks.splice(bi, 1)
                this.data.value.tasks.push({
                    ...buffer,
                    s: false,
                    jobCount: buffer.jobs_uuid.length
                })
            }
            resolve()
        }) : this.backend.value.invoke('load_task', uuid).then((text:string) => {
            const buffer:Task | undefined = JSON.parse(text)
            if(buffer != undefined){
                if(bi != -1) this.data.value.tasks.splice(bi, 1)
                this.data.value.tasks.push({
                    ...buffer,
                    s: false,
                    jobCount: buffer.jobs_uuid.length
                })
            }
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Task", this.selectTask)
        })
    }

    load_all_task = async ():Promise<void> => {
        const p:Promise<void> = !this.backend.value.config.haveBackend ? 
        new Promise((resolve) => {
            this.data.value.tasks = this.static_server.value?.memory.tasks.map((x:Task):TaskTable => {
                return {
                    ...x,
                    s: false,
                    jobCount: x.jobs.length,
                }
            }) || []
            resolve()
        }) : this.backend.value.invoke('load_all_task').then((texts:Array<string>) => {
            this.data.value.tasks = texts.map((y:string):TaskTable => {
                const p:Task = JSON.parse(y)
                return {
                    ...p,
                    s: false,
                    jobCount: p.jobs.length
                }
            })
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Task", this.data.value.projects)
        })
    }

    load_jobs = async (uuid:string):Promise<void> => {
        const p = !this.backend.value.config.haveBackend ?
        new Promise<void>(async (resolve) => {
            if(this.static_server.value == undefined) return
            this.data.value.jobs = await this.static_server.value.module_project.GetTaskRelatedJob(uuid)
            resolve()
        }) : this.backend.value.invoke(`project_module:get_jobs`, uuid).then(x => {
            const p:Array<Job> = x
            this.data.value.jobs = p
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("job", this.selectTask.value, this.data.value.jobs)
        })
    }

    load_all_job = async ():Promise<void> => {
        const p:Promise<void> = !this.backend.value.config.haveBackend ? 
        new Promise((resolve) => {
            this.data.value.jobs = this.static_server.value?.memory.jobs.map((x:Job):JobTable => {
                return {
                    ...x,
                    s: false,
                }
            }) || []
            resolve()
        }) : this.backend.value.invoke('load_all_job').then((texts:Array<string>) => {
            this.data.value.jobs = texts.map((y:string):JobTable => {
                const p:Job = JSON.parse(y)
                return {
                    ...p,
                    s: false,
                }
            })
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Job", this.data.value.projects)
        })
    }

    load_all_database = async ():Promise<void> => {
        const p:Promise<void> =  !this.backend.value.config.haveBackend ?
        new Promise((resolve) => {
            this.data.value.databases = this.static_server.value?.memory.database.map((x:Database):DatabaseTable => {
                return {
                    ...x,
                    s: false,
                }
            }) || []
            resolve()
        }) : this.backend.value.invoke('load_all_database').then((texts:Array<string>) => {
            this.data.value.databases = texts.map((y):DatabaseTable => {
                const p:Database = JSON.parse(y)
                return {
                ...p,
                s: false
                }
            })
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Databases", this.data.value.databases)
        })
    }

    load_all_node = async ():Promise<void> => {
        const callback = () => {
            this.data.value.nodes.forEach(y => {
                if(this.backend.value.config.haveBackend){
                    console.log("backend node_add", y.url, y.uuid)
                    this.backend.value.send("node_add", y.url, y.uuid)
                }else{
                    console.log("static web node_add", y.url, y.uuid)
                    this.data.value.websocket_manager?.server_start(y.url, y.uuid)
                }
            })
        }
        const p:Promise<void> =  !this.backend.value.config.haveBackend ?
        new Promise((resolve) => {
            this.data.value.nodes = this.static_server.value?.memory.nodes.map((x:Node):NodeTable => {
                return {
                    ...x,
                    s: false,
                    state: 0,
                    connection_rate: 0,
                }
            }) || []
            resolve()
        }) : this.backend.value.invoke('load_all_node').then((texts:Array<string>) => {
            const buffer:Array<Node> = texts.map(y => JSON.parse(y))
            for(const x of buffer){
                const c = this.data.value.nodes.find(y => y.uuid == x.uuid)
                if(c == undefined){
                    this.data.value.nodes.push({
                        ...x,
                        s: false,
                        state: 0,
                        connection_rate: 0,
                    })
                }
            }
            
        })
        return p.then(() => {
            callback()
            if (process.env.NODE_ENV == 'development') console.log("Nodes", this.data.value.nodes)
        })
    }

    load_all_lib = async ():Promise<void> => {
        return this.backend.value.invoke('list_all_lib').then((texts:Array<string>) => {
            if (process.env.NODE_ENV == 'development') console.log("Raw Libs", texts)
            this.data.value.libs = texts.map((y:string):Library => {
                const ext = y.split('.').pop()!
                return {
                    uuid: "",
                    name: y.slice(0, -(ext.length + 1)),
                    load: false,
                    content: ""
                }
            })
            if (process.env.NODE_ENV == 'development') console.log("Libs", this.data.value.libs)
        })
    }

    load_plugin = async ():Promise<void> => {
        const p:Promise<void> =  !this.backend.value.config.haveBackend ?
        new Promise((r) => r()) : this.backend.value.invoke('get_plugin').then((text:any) => {
            this.data.value.plugin = text
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Plugins", this.data.value.plugin)
        })
    }

    load_all_log = async () => {
        const p:Promise<void> =  !this.backend.value.config.haveBackend ?
        new Promise((resolve) => {
            this.data.value.logs = this.static_server.value?.memory.logs || []
            resolve()
        }) : this.backend.value.invoke('load_all_database').then((texts:Array<string>) => {
            const ll:Array<ExecutionLog> = texts.map(x => JSON.parse(x))
            ll.forEach(x => x.output = true)
            this.data.value.logs = ll
        })
        return p.then(() => {
            if (process.env.NODE_ENV == 'development') console.log("Log", this.data.value.logs)
        })
    }

    load_all_plugin = async () => {
        if(!this.backend.value.config.haveBackend) return
        this.backend.value.invoke('get_plugin').then(x => {
            this.data.value.plugin = x
        })
    }
}