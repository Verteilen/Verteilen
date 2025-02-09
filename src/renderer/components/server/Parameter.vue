<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Parameter, Project } from '../../interface';

interface PROPS {
    select: Project | undefined
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'edit', data:Parameter): void
}>()
const hasSelect = ref(false)
const createModal = ref(false)
const renameModal = ref(false)
const renameData = ref({ type: 0, oldname: '', name: '' })
const createData = ref({ temp: false, name: '', type: 0 })
const types = ref(['字串', '數字', '布林'])
const options:Ref<Array<{ text: string, value:number }>> = ref([])
const dirty = ref(false)
const buffer:Ref<Parameter> = ref({ numbers: [], strings: [], booleans: [] })

const updateParameter = () => {
    if( props.select == undefined) return
    buffer.value = props.select.parameter
    dirty.value = false
}

const getArray = (n:number):Array<{ s?:boolean, name: string, value: any }> => {
    if( props.select == undefined) return []
    if (n == 0) return buffer.value.strings
    else if (n == 1) return buffer.value.numbers
    else return buffer.value.booleans
}

const createParameter = () => {
    createData.value = { temp: false, name: '', type: 0 }
    createModal.value = true
}

const cloneSelect = () => {
    dirty.value = true
}

const saveParameter = () => {
    emits('edit', buffer.value)
}

const rename = (type:number, oldname:string) => {
    renameData.value = { type: type, oldname: oldname, name: oldname }
    renameModal.value = true;
}

const deleteSelect = () => {
    dirty.value = true
}

const confirmCreate = () => {
    createModal.value = false
    getArray(createData.value.type).push({ name: createData.value.name, value: 0 })
    dirty.value = true
}

const confirmRename = () => {
    dirty.value = true
}

const datachange = () => {
    hasSelect.value = buffer.value.booleans.filter(x => x.s).length > 0 || 
        buffer.value.strings.filter(x => x.s).length > 0 || 
        buffer.value.numbers.filter(x => x.s).length > 0;
}

onMounted(() => {
    options.value = types.value.map((x, i) => {
        return {
            text: x,
            value: i
        }
    })
    emitter?.on('updateParameter', updateParameter)
})

onUnmounted(() => {
    emitter?.off('updateParameter', updateParameter)
})

</script>

<template>
    <div>
        <div class="my-3">
            <b-button-group>
                <b-button variant='primary' @click="createParameter" :disabled="select == undefined">新增</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">克隆</b-button>
                <b-button variant='primary' @click="saveParameter" :disabled="select == undefined || !dirty">存檔</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">刪除</b-button>
            </b-button-group>
        </div>
        <b-card no-body ag="article" class="my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                當前選擇專案: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
            </b-card-text>
        </b-card>
        <hr />
        <b-container fluid>
            <b-row v-if="select != undefined">
                <b-col cols="4" v-for="n in 3" :key="n">
                    <h3>{{ types[n - 1] }}參數</h3>
                    <b-card v-for="(c, i) in getArray(n - 1)" :key="i" no-body class="px-2">
                        <b-card-text>
                            <b-row>
                                <b-col cols="4" class="pt-1">
                                    <b-form-checkbox v-model="c.s" @change="datachange"> {{ c.name }} </b-form-checkbox>
                                </b-col>
                                <b-col cols="5">
                                    <b-form-input v-if="n == 1" v-model="c.value" @input="dirty = true"></b-form-input>
                                    <b-form-input v-else-if="n == 2" v-model.number="c.value" @input="dirty = true" type="number"></b-form-input>
                                    <b-form-checkbox v-else v-model="c.value" @input="dirty = true"></b-form-checkbox>
                                </b-col>
                                <b-col cols="3">
                                    <b-button @click="rename(n - 1, c.name)">改名</b-button>
                                </b-col>
                            </b-row>
                            <span></span>
                        </b-card-text>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
        <b-modal title="新增參數" v-model="createModal" hide-footer>
            <b-form-checkbox v-model="createData.temp">使用樣板</b-form-checkbox>
            <div v-if="createData.temp">

            </div>
            <div v-else>
                <b-form-input class="mt-3" v-model="createData.name" required placeholder="輸入參數名稱"></b-form-input>
                <b-form-select class="mt-3" v-model="createData.type" :options="options"></b-form-select>
            </div>
            
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
        <b-modal title="新增參數" v-model="renameModal" hide-footer>
            <b-form-input v-model="renameData.name" required placeholder="輸入參數名稱"></b-form-input>
            <b-button class="mt-3" variant="primary" @click="confirmRename">改名</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
