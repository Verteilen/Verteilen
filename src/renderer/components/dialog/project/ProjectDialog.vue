<script setup lang="ts">
//#region Modules
import { computed, Ref, ref, watch } from 'vue';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { CreateField, DialogDATA } from '../../server/Project';
import { i18n } from '../../../plugins/i18n';
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue';
import { TemplateData_Project } from 'verteilen-core/src/interface';
//#endregion

//#region Data
const $t = i18n.global.t
const theme = useTheme()
const data = defineModel<boolean>({ required: true })
const propss = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
    (e: 'changed'):void
}>()
const buffer:Ref<CreateField> = ref({title: "", description: "", useTemp: false, genPara: false, usePara: false, temp: null, database: null, database_title: null})
const selectTempModel = ref(false)
const selectTemp:Ref<string | null> = ref(null)
const search:Ref<string | null> = ref(null)
//#endregion

//#region Watch
watch(() => data.value, () => {
    search.value = null
    selectTempModel.value = false
    selectTemp.value = null
    if(propss.isEdit) buffer.value = propss.editData
    else buffer.value = {title: "", description: "", useTemp: false, genPara: false, usePara: false, temp: null, database: null, database_title: null}
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
    let v:Array<Array<TemplateData_Project>> = []
    propss.plugin.plugins.forEach(x => {
        x.projects.forEach(y => {
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
const convert = computed(() => {
    return {
        ...buffer.value,
        useTemp: buffer.value.temp != null,
        usePara: buffer.value.database != null,
    }
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
const onSelectTemp = (d:TemplateData_Project) => {
    const str = `${d.group}/${d.filename}`
    if(selectTemp.value == str) selectTemp.value = null
    else selectTemp.value = str
}
const confirm_temp = () => {
    buffer.value.temp = selectTemp.value
    buffer.value.database_title = `${$t('enum.database.default')} ${buffer.value.temp}`
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
        'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'">
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
            <v-text-field v-model="buffer.title" :autofocus="true" :error="propss.titleError" required :label="$t('modal.enter-project-name')" hide-details @update:model-value="emits('changed')"></v-text-field>
            <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-project-description')" hide-details @update:model-value="emits('changed')"></v-text-field>
            <div v-if="!propss.isEdit">
                <br />
                <v-btn class="w-100" color="primary" variant="outlined" @click="openSelectTemp">
                    <span v-if="buffer.temp != null"> {{ buffer.temp }} </span>
                    <span v-else> {{ $t('useTemplate') }} </span>
                </v-btn>
                <br />
                <v-row>
                    <v-col cols="6">
                        <v-checkbox v-if="!buffer.genPara" v-model="buffer.usePara" :label="$t('useExistDatabase')" hide-details @update:model-value="emits('changed')"></v-checkbox>
                    </v-col>
                    <v-col cols="6">
                        <v-checkbox v-if="!buffer.usePara && buffer.temp != null" v-model="buffer.genPara" :label="$t('modal.generate-database')" hide-details @update:model-value="emits('changed')"></v-checkbox>
                    </v-col>
                </v-row>
                <v-text-field v-if="buffer.genPara" clearable v-model="buffer.database_title" :label="$t('modal.enter-database-set-name')" @update:model-value="emits('changed')"></v-text-field>
                <v-autocomplete v-if="buffer.usePara" :item-props="itemProps" v-model="buffer.database" clearable :items="paras" item-title="text" :label="$t('database')" hide-details></v-autocomplete>
            </div>
            <p v-if="propss.errorMessage.length > 0" class="mt-3 text-red">{{ propss.errorMessage }}</p>

            <!-- Popup template selection -->
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
                            <v-list-item v-for="(g, j) in group" :key="g.title + String(j)" :title="g.title" :value="`item-${i}-${j}`" @click="onSelectTemp(g)">
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

<style scoped>
.bg {
    background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(33, 44, 42));
}
</style>