<script setup lang="ts">
//#region Modules
import { computed, Ref, ref, watch } from 'vue';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { CreateField, DialogDATA, Temp } from '../../server/Project';
import { i18n } from 'verteilen-core/src/plugins/i18n';
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const theme = useTheme()
const data = defineModel<boolean>({ required: true })
const propss = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({title: "", description: "", usePara: false, useTemp: false, temp: null, database: null})
const selectTempModel = ref(false)
const selectTempIndex:Ref<Array<number | string>> = ref([])
const search:Ref<string | null> = ref(null)
//#endregion

//#region Watch
watch(() => data.value, () => {
    search.value = null
    selectTempModel.value = false
    if(propss.isEdit) buffer.value = propss.editData
    else buffer.value = {title: "", description: "", useTemp: false, usePara: false, temp: null, database: null}
})
//#endregion

//#region Computed
const isDark = computed(() => theme.global.name.value == "dark")
const paras = computed(() => {
    return propss.databases.map((x, index) => {
        return {
            value: x.uuid,
            title: x.title,
            uuid: x.uuid
        }
    })
})
const groups = computed(() => {
    let v:Array<Array<Temp>> = []
    propss.temps.forEach(x => {
        const index = v.findIndex(y => y[0].group === x.group)
        if(index == -1) v.push([x])
        else v[index].push(x)
    })
    if(search.value != null){
        for(let i = 0; i < v.length; i++){
            v[i] = v[i].filter(p => p.text.includes(search.value!))
        }
    }
    v = v.filter(x => x.length > 0)
    return v
})
const convert = computed(() => {
    return {
        ...buffer.value,
        useTemp: buffer.value.temp != null,
        usePara: buffer.value.database != null
    }
})
const temp_name = computed(() => {
    if(buffer.value.temp == undefined) return ''
    if(typeof buffer.value.temp == 'number') return propss.temps.find(x => x.value == buffer.value.temp)?.text
    else return propss.temps.find(x => x.text == buffer.value.temp)?.text
})
//#endregion

//#region Methods
const itemProps = (item:any) => {
    return {
        title: item.title,
        subtitle: item.uuid
    }
}
const openSelectTemp = () => {
    selectTempModel.value = true
}
const onSelectTemp = (d:Temp) => {
    selectTempIndex.value = d.value >= 1000 ? [d.text] : [d.value]
}
const confirm_temp = () => {
    buffer.value.temp = selectTempIndex.value[0]
    selectTempModel.value = false
}
const confirm = () => {
    emits('submit', convert.value)
}
//#endregion
</script>

<template>
    <DialogBase width="500" v-model="data" :color=" isDark ? 
        'linear-gradient(to left, rgb(33, 33, 33), rgb(33, 40, 42))' : 
        'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'"
        :preference="propss.preference">
        <template #title>
            <div v-if="propss.isEdit">
                <v-icon>mdi-pencil</v-icon>
                {{ $t('modal.modify-project') }}
            </div>
            <div v-else>
                <v-icon>mdi-hammer</v-icon>
                {{ $t('modal.new-project') }}
            </div>
        </template>
        <template #text>
            <v-text-field v-model="buffer.title" :autofocus="true" :error="propss.titleError" required :label="$t('modal.enter-project-name')" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-project-description')" hide-details></v-text-field>
            <div v-if="!propss.isEdit">
                <br />
                <v-btn class="w-100" color="primary" variant="outlined" @click="openSelectTemp">
                    <span v-if="temp_name">
                        {{ temp_name }}
                    </span>
                    <span v-else>
                        {{ $t('useTemplate') }}
                    </span>
                </v-btn>
                <br />
                <v-checkbox v-model="buffer.usePara" :label="$t('useExistDatabase')" hide-details></v-checkbox>
                <v-autocomplete v-if="buffer.usePara" :item-props="itemProps" v-model="buffer.database" clearable :items="paras" item-title="text" :label="$t('database')" hide-details></v-autocomplete>
            </div>
            <p v-if="propss.errorMessage.length > 0" class="mt-3 text-red">{{ propss.errorMessage }}</p>


            <DialogBase width="60vw" height="80vh" v-model="selectTempModel" :color="isDark ? 
                'linear-gradient(to left, rgb(33, 33, 33), rgb(33, 40, 42))' : 
                'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'"
                :preference="propss.preference">
                <template #title>
                    <v-icon>mdi-select</v-icon>
                    {{ $t('modal.project-template-select') }}
                </template>
                <template #text>
                    <v-text-field :label="$t('search')" v-model.trim="search" hide-details clearable></v-text-field>
                    <v-list style="height: calc(80vh - 250px);">
                        <v-list-group v-for="(group, i) in groups" :key="group[0].group + String(i)">
                            <template v-slot:activator="{ props }">
                                <v-list-item v-bind="props" :title="group[0].group">
                                </v-list-item>
                            </template>
                            <v-list-item v-for="(g, j) in group" :key="g.text + String(j)" :title="g.text" :value="g.value" @click="onSelectTemp(g)">
                            </v-list-item>
                        </v-list-group>
                    </v-list>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" :disabled="selectTempIndex.length == 0" @click="confirm_temp">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(propss.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>

<style scoped>
.bg {
    background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(33, 44, 42));
}
</style>