import { Ref } from "vue"
import { NodeTable } from "../../interface"
import { DATA, save_and_update } from "./server"

export class Util_Server_Node {
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    server_clients_update = (v:Array<NodeTable>) => {
        const old:Array<NodeTable> = JSON.parse(JSON.stringify(this.data.value.nodes))
        this.data.value.nodes = v
        old.filter(x => x.s).forEach(x => {
            const index = this.data.value.nodes.findIndex(y => y.ID == x.ID)
            if(index != -1){
                this.data.value.nodes[index].s = true
            }
        })
        this.update()
    }
}