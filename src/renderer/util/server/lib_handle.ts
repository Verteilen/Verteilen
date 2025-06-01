import { Ref } from "vue"
import { DATA, save_and_update } from "./server"

export class Util_Server_Lib {
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }
}