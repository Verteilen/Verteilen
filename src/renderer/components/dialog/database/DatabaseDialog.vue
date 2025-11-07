<script setup lang="ts">
//#region Modules
import { computed, Ref, ref, watch } from 'vue'
import { useTheme } from 'vuetify/lib/framework.mjs';
import { CreateField, DialogDATACreateSet } from '../../server/Database';
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue'
import { i18n } from '../../../plugins/i18n';
import { TemplateData_Database } from 'verteilen-core/src/interface';
//#endregion

//#region Data
const $t = i18n.global.t
const theme = useTheme()
const data = defineModel<boolean>()
const propss = defineProps<DialogDATACreateSet>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({ name: "", temp: null, canWrite: true, useTemp: false })
const selectTempModel = ref(false)
const selectTemp:Ref<string | null> = ref(null)
const search:Ref<string | null> = ref(null)
//#endregion

//#region Computed
const isDark = computed(() => theme.global.name.value == "dark")
const convert = computed(() => {
    return {
        name: buffer.value.name,
        temp: buffer.value.temp,
        canWrite: buffer.value.canWrite,
        useTemp: buffer.value.temp != null
    }
})
const groups = computed(() => {
    let v:Array<Array<TemplateData_Database>> = []
    propss.plugin.plugins.forEach(x => {
        x.databases.forEach(y => {
            const index = v.findIndex(z => z[0].group === y.group)
            if(index == -1) v.push([y])
            else v[index].push(y)
        })
    })
    if(search.value != null){
        for(let i = 0; i < v.length; i++){
            v[i] = v[i].filter(p => p.title.includes(search.value!))
        }
    }
    v = v.filter(x => x.length > 0)
    return v
})
//#endregion

//#region Watch
watch(() => data.value, () => {
    search.value = null
    selectTempModel.value = false
    selectTemp.value = null
    if(propss.isEdit) buffer.value = { 
        name: propss.targetData.name, 
        canWrite: propss.targetData.canWrite,
        temp: propss.targetData.temp,  
        useTemp: propss.targetData.temp != null
    }
    else buffer.value = { name: '', temp: null, canWrite: true, useTemp: false }
})
//#endregion

const openSelectTemp = () => {
    selectTempModel.value = true
}

const onSelectTemp = (d:TemplateData_Database) => {
    const str = `${d.group}/${d.filename}`
    if(selectTemp.value == str) selectTemp.value = null
    else selectTemp.value = str
}

const confirm_temp = () => {
    buffer.value.temp = selectTemp.value
    selectTempModel.value = false
}

const confirm = () => {
    emits('submit', convert.value)
}
</script>

<template>
    <DialogBase width="500" v-model="data!">
        <template #title v-if="!propss.isEdit">
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-database-set') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.edit-database-set') }}
        </template>
        <template #text>
            <v-text-field :error="propss.titleError" v-model="buffer.name" required :label="$t('modal.enter-database-set-name')" hide-details></v-text-field>
            <v-btn v-if="!propss.isEdit" class="mt-3 w-100" color="primary" variant="outlined" @click="openSelectTemp">
                <span v-if="buffer.temp != null">
                    {{ buffer.temp }}
                </span>
                <span v-else>
                    {{ $t('useTemplate') }}
                </span>
            </v-btn>
            <v-checkbox class="pr-5" :label="$t('filter.canwrite')" v-model="buffer.canWrite" hide-details></v-checkbox>

            <DialogBase width="60vw" height="80vh" v-model="selectTempModel" :color="isDark ? 
                'linear-gradient(to left, rgb(33, 33, 33), rgb(33, 40, 42))' : 
                'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'">
                <template #title>
                    <v-icon>mdi-select</v-icon>
                    {{ $t('modal.database-template-select') }}
                </template>
                <template #text>
                    <v-text-field :label="$t('search')" v-model.trim="search" hide-details clearable></v-text-field>
                    <v-list style="height: calc(80vh - 250px);">
                        <v-list-group v-for="(group, i) in groups" :key="group[0].group + String(i)">
                            <template v-slot:activator="{ props }">
                                <v-list-item v-bind="props" :title="group[0].group">
                                </v-list-item>
                            </template>
                            <v-list-item v-for="(g, j) in group" :key="g.title + String(j)" :title="g.title" :value="g.value" @click="onSelectTemp(g)">
                            </v-list-item>
                        </v-list-group>
                    </v-list>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" :disabled="selectTemp == null" @click="confirm_temp">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>

        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(propss.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>