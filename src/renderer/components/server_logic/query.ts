import { Database, DatabaseTable, ExecutionLog, Library, Node, Preference, Project, ProjectTable } from "verteilen-core/src/interface"
import { Ref } from "vue"
import { DATA } from "."
import { BackendProxy } from "../../proxy"
import { backend } from "../../plugins/backend"


export class ServerQuery {

    data:Ref<DATA>
    backend:Ref<BackendProxy>
    preference:Ref<Preference>

    constructor(data:Ref<DATA>,
        backend:Ref<BackendProxy>,
        preference:Ref<Preference>
    ) {
        this.data = data
        this.backend = backend
        this.preference = preference
    }

    load_all_record = async () => {
        return this.backend.value.invoke('load_all_record').then((texts:Array<string>) => {
            if (process.env.NODE_ENV == 'development') console.log("Raw Project", texts)
            this.data.value.projects = texts.map((y:string):ProjectTable => {
                const p:Project = JSON.parse(y)
                return {
                    ...p,
                    s: false,
                    taskCount: p.task.length
                }
            })
            if (process.env.NODE_ENV == 'development') console.log("Project", this.data.value.projects)
        })
    }

    load_all_database = async () => {
        return this.backend.value.invoke('load_all_database').then((texts:Array<string>) => {
            if (process.env.NODE_ENV == 'development') console.log("Raw Databases", texts)
            this.data.value.databases = texts.map((y):DatabaseTable => {
                const p:Database = JSON.parse(y)
                return {
                ...p,
                s: false
                }
            })
            if (process.env.NODE_ENV == 'development') console.log("Databases", this.data.value.databases)
        })
    }

    load_all_node = async () => {
        return this.backend.value.invoke('load_all_node').then((texts:Array<string>) => {
            if (process.env.NODE_ENV == 'development') console.log("Raw Nodes", texts)
            const buffer:Array<Node> = texts.map(y => JSON.parse(y))
            for(const x of buffer){
                const c = this.data.value.nodes.find(y => y.uuid == x.uuid)
                if(c == undefined){
                    this.data.value.nodes.push({
                        ...x,
                        s: false,
                        state: 0,
                        connection_rate: 0
                    })
                }
            }
            this.data.value.nodes.forEach(y => {
                if(this.backend.value.config.haveBackend){
                    console.log("backend node_add", y.url, y.uuid)
                    this.backend.value.send("node_add", y.url, y.uuid)
                }else{
                    console.log("static web node_add", y.url, y.uuid)
                    this.data.value.websocket_manager?.server_start(y.url, y.uuid)
                }
            })
            if (process.env.NODE_ENV == 'development') console.log("Nodes", this.data.value.nodes)
        })
    }

    load_all_lib = async () => {
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

    load_plugin = async () => {
        return this.backend.value.invoke('get_plugin').then((text:any) => {
            if (process.env.NODE_ENV == 'development') console.log("Raw Plugins", text)
            this.data.value.plugin = text
            if (process.env.NODE_ENV == 'development') console.log("Plugins", this.data.value.plugin)
        })
    }

    load_all_log = async () => {
        return this.backend.value.invoke('load_all_log').then((texts:Array<string>) => {
            const ll:Array<ExecutionLog> = texts.map(x => JSON.parse(x))
            ll.forEach(x => x.output = true)
            if (process.env.NODE_ENV == 'development') console.log("Logs", ll)
            this.data.value.logs = ll
        })
    }
}