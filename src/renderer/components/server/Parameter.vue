<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Parameter, Project } from '../../interface';
import { i18n } from '../../plugins/i18n';

interface PROPS {
    select: Project | undefined
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'edit', data:Parameter): void
}>()
const createModal = ref(false)
const renameModal = ref(false)
const renameData = ref({ type: 0, oldname: '', name: '' })
const createData = ref({ temp: false, name: '', type: 0 })
const types = ref(['字串', '數字', '布林'])
const options:Ref<Array<{ text: string, value:number }>> = ref([])
const dirty = ref(false)
const buffer:Ref<Parameter> = ref({ numbers: [], strings: [], booleans: [] })
const errorMessage = ref('')
const titleError = ref(false)
const search = ref('')

const hasSelect = computed(() => {
    return buffer.value.booleans.filter(x => x.s).length > 0 || 
        buffer.value.strings.filter(x => x.s).length > 0 || 
        buffer.value.numbers.filter(x => x.s).length > 0
}) 

const updateParameter = () => {
    if( props.select == undefined) return
    buffer.value = JSON.parse(JSON.stringify(props.select.parameter))
    dirty.value = false
}

const getArray = (n:number):Array<{ s?:boolean, name: string, value: any }> => {
    if( props.select == undefined) return []
    if (n == 0) return search.value == null || search.value.length == 0 ? buffer.value.strings : buffer.value.strings.filter(x => x.name.includes(search.value))
    else if (n == 1) return search.value == null || search.value.length == 0 ? buffer.value.numbers : buffer.value.numbers.filter(x => x.name.includes(search.value))
    else return search.value == null || search.value.length == 0 ? buffer.value.booleans : buffer.value.booleans.filter(x => x.name.includes(search.value))
}

const createParameter = () => {
    createData.value = { temp: false, name: '', type: 0 }
    createModal.value = true
    errorMessage.value = ''
    titleError.value = false
}

const cloneSelect = () => {
    const bs = buffer.value.booleans.filter(x => x.s)
    const ss = buffer.value.strings.filter(x => x.s)
    const ns = buffer.value.numbers.filter(x => x.s)
    bs.forEach(x => x.name += ` (${i18n.global.t('clone')})`)
    ss.forEach(x => x.name += ` (${i18n.global.t('clone')})`)
    ns.forEach(x => x.name += ` (${i18n.global.t('clone')})`)
    buffer.value.booleans.push(...bs)
    buffer.value.strings.push(...ss)
    buffer.value.numbers.push(...ns)
    dirty.value = true
}

const saveParameter = () => {
    emits('edit', buffer.value)
}

const rename = (type:number, oldname:string) => {
    renameData.value = { type: type, oldname: oldname, name: oldname }
    renameData.value.type = type
    renameModal.value = true;
    errorMessage.value = ''
    titleError.value = false
}

const selectall = (s:boolean) => {
    buffer.value.booleans.forEach(x => x.s = s)
    buffer.value.strings.forEach(x => x.s = s)
    buffer.value.numbers.forEach(x => x.s = s)
}

const confirmRename = () => {
    if(renameData.value.name.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    if (renameData.value.type == 0){
        const ss = buffer.value.strings.findIndex(x => x.name == renameData.value.oldname)
        const iss = buffer.value.strings.findIndex(x => x.name == renameData.value.name)
        if(ss != -1 && iss == -1) {
            buffer.value.strings[ss].name = renameData.value.name
        }else{
            errorMessage.value = i18n.global.t('error.title-repeat')
            titleError.value = true
            return
        }
    }
    else if (renameData.value.type == 0){
        const ns = buffer.value.numbers.findIndex(x => x.name == renameData.value.oldname)
        const ins = buffer.value.numbers.findIndex(x => x.name == renameData.value.name)
        if(ns != -1 && ins == -1) {
            buffer.value.numbers[ns].name = renameData.value.name
        }else{
            errorMessage.value = i18n.global.t('error.title-repeat')
            titleError.value = true
            return
        }
    }
    else if (renameData.value.type == 0){
        const bs = buffer.value.booleans.findIndex(x => x.name == renameData.value.oldname)
        const ibs = buffer.value.booleans.findIndex(x => x.name == renameData.value.name)
        if(bs != -1 && ibs == -1) {
            buffer.value.booleans[bs].name = renameData.value.name
        }else{
            errorMessage.value = i18n.global.t('error.title-repeat')
            titleError.value = true
            return
        }
    }
    renameModal.value = false;
    dirty.value = true
}

const deleteSelect = () => {
    const bs = buffer.value.booleans.filter(x => !x.s)
    const ss = buffer.value.strings.filter(x => !x.s)
    const ns = buffer.value.numbers.filter(x => !x.s)
    buffer.value.booleans = bs
    buffer.value.strings = ss
    buffer.value.numbers = ns
    dirty.value = true
}

const setdirty = () => dirty.value = true

const confirmCreate = () => {
    if(createData.value.name.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    createModal.value = false
    getArray(createData.value.type).push({ name: createData.value.name, value: 0 })
    dirty.value = true
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
            <v-toolbar density="compact" class="pr-3">
                <v-text-field max-width="400px" class="pl-5 mr-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search"></v-text-field>
                <p v-if="props.select != undefined" class="pt-3 mr-4">
                    {{ $t('project') }}: {{ props.select.title }}
                </p>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createParameter" :disabled="select == undefined">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" color="success" @click="saveParameter" :disabled="select == undefined || !dirty">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('save') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall(true)">
                            <v-icon>mdi-check-bold</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall(false)">
                            <v-icon>mdi-check-outline</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('unselectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="cloneSelect" :disabled="!hasSelect || select == undefined">
                            <v-icon>mdi-content-paste</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clone') }}
                </v-tooltip>         
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='danger' v-bind="props" @click="deleteSelect" :disabled="!hasSelect || select == undefined">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
            </v-toolbar>
        </div>
        <div class="py-3 px-5 text-left">
            <v-expansion-panels color="dark" class="px-6 text-white" multiple>
                <v-expansion-panel v-for="n in 3" :key="n" class="my-2">
                    <v-expansion-panel-title>
                        <h4 v-if="n == 1">{{ $t('types.string') }}</h4>
                        <h4 v-else-if="n == 2">{{ $t('types.number') }}</h4>
                        <h4 v-else-if="n == 3">{{ $t('types.boolean') }}</h4>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-row v-for="(c, i) in getArray(n - 1)" :key="i">
                            <v-col cols="auto">
                                <v-checkbox v-model="c.s" width="30" hide-details @input="setdirty"></v-checkbox>
                            </v-col>
                            <v-col cols="10">
                                <v-text-field v-if="n == 1" :label="c.name" v-model="c.value" hide-details @input="setdirty"></v-text-field>
                                <v-text-field v-else-if="n == 2" :label="c.name" v-model.number="c.value" type="number" hide-details @input="setdirty"></v-text-field>
                                <v-checkbox v-else-if="n == 3" :label="c.name" v-model="c.value" hide-details @input="setdirty"></v-checkbox>
                            </v-col>
                            <v-col cols="1" class="mt-3">
                                <v-btn class="w-100" color="primary" @click="rename(n - 1, c.name)" @input="setdirty">{{ $t('rename') }}</v-btn>
                            </v-col>
                        </v-row>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </div>
        <v-dialog width="500" v-model="createModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-parameter') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="createData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
                    <v-select class="mt-3" v-model="createData.type" :items="options" item-title="text" :label="$t('modal.parameter-datatype')" hide-details></v-select>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmCreate">{{ $t('create') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="renameModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.rename-parameter') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="renameData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmRename">{{ $t('rename') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>
