<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
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
    const bs = buffer.value.booleans.filter(x => x.s)
    const ss = buffer.value.strings.filter(x => x.s)
    const ns = buffer.value.numbers.filter(x => x.s)
    bs.forEach(x => x.name += "_clone")
    ss.forEach(x => x.name += "_clone")
    ns.forEach(x => x.name += "_clone")
    buffer.value.booleans.push(...bs)
    buffer.value.strings.push(...ss)
    buffer.value.numbers.push(...ns)
    dirty.value = true
    datachange()
}

const saveParameter = () => {
    emits('edit', buffer.value)
}

const rename = (type:number, oldname:string) => {
    renameData.value = { type: type, oldname: oldname, name: oldname }
    renameModal.value = true;
}

const deleteSelect = () => {
    const bs = buffer.value.booleans.filter(x => !x.s)
    const ss = buffer.value.strings.filter(x => !x.s)
    const ns = buffer.value.numbers.filter(x => !x.s)
    buffer.value.booleans = bs
    buffer.value.strings = ss
    buffer.value.numbers = ns
    dirty.value = true
    datachange()
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
    nextTick(() => {
        updateParameter()
    })
})

onUnmounted(() => {
    emitter?.off('updateParameter', updateParameter)
})

</script>

<template>
    <div>
        <div class="py-3">
            <b-button-group>
                <b-button variant='primary' @click="createParameter" :disabled="select == undefined">{{ $t('create') }}</b-button>
                <b-button variant='primary' @click="saveParameter" :disabled="select == undefined || !dirty">{{ $t('save') }}</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">{{ $t('clone') }}</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">{{ $t('delete') }}</b-button>
            </b-button-group>
        </div>
        <b-card no-body ag="article" bg-variant="dark" border-variant="primary" class="text-white my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
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
                    <b-card v-for="(c, i) in getArray(n - 1)" :key="i" no-body bg-variant="dark" border-variant="primary" class="text-white mb-3 px-4">
                        <b-card-text>
                            <b-row>
                                <b-col cols="4" class="pt-1">
                                    <b-form-checkbox v-model="c.s" @change="datachange"> {{ c.name }} </b-form-checkbox>
                                </b-col>
                                <b-col cols="5">
                                    <v-text-field v-if="n == 1" v-model="c.value" @input="dirty = true" density="compact" hide-details></v-text-field>
                                    <v-text-field v-else-if="n == 2" v-model.number="c.value" @input="dirty = true" type="number" density="compact" hide-details></v-text-field>
                                    <b-form-checkbox v-else v-model="c.value" @input="dirty = true"></b-form-checkbox>
                                </b-col>
                                <b-col cols="3">
                                    <b-button @click="rename(n - 1, c.name)">{{ $t('rename') }}</b-button>
                                </b-col>
                            </b-row>
                            <span></span>
                        </b-card-text>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
        <b-modal title="新增參數" v-model="createModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <b-form-checkbox v-model="createData.temp">使用樣板</b-form-checkbox>
            <div v-if="createData.temp">

            </div>
            <div v-else>
                <v-text-field class="mt-3" v-model="createData.name" required label="輸入參數名稱" hide-details></v-text-field>
                <v-select class="mt-3" v-model="createData.type" :items="options" item-title="text" label="資料型態" hide-details></v-select>
            </div>
            
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
        <b-modal title="新增參數" v-model="renameModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field v-model="renameData.name" required label="輸入參數名稱" hide-details></v-text-field>
            <b-button class="mt-3" variant="primary" @click="confirmRename">改名</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
