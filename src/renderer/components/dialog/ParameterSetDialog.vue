<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue'
import { useTheme } from 'vuetify/lib/framework.mjs';
import { CreateField, DialogDATACreateSet, Temp } from '../../util/parameter';
import DialogBase from '../dialog/DialogBase.vue'

const theme = useTheme()
const data = defineModel<boolean>()
const propss = defineProps<DialogDATACreateSet>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({ name: "", temp: null })
const selectTempModel = ref(false)
const selectTempIndex:Ref<Array<number | string>> = ref([])
const search:Ref<string | null> = ref(null)

const isDark = computed(() => theme.global.name.value == "dark")
const convert = computed(():CreateField => {
    return {
        name: buffer.value.name,
        temp: buffer.value.temp,
    }
})
const temp_name = computed(() => {
    if(typeof buffer.value.temp == 'number') return propss.temps.find(x => x.value == buffer.value.temp)?.text
    else return buffer.value.temp 
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

watch(() => data.value, () => {
    search.value = null
    selectTempModel.value = false
    if(propss.isEdit) buffer.value = { name: propss.targetData.name, temp: propss.targetData.temp }
    else buffer.value = { name: '', temp: null }
})

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
</script>

<template>
    <DialogBase width="500" v-model="data!">
        <template #title v-if="!propss.isEdit">
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-parameter-set') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.edit-parameter-set') }}
        </template>
        <template #text>
            <v-text-field :error="propss.titleError" v-model="buffer.name" required :label="$t('modal.enter-parameter-set-name')" hide-details></v-text-field>
            <v-btn v-if="!propss.isEdit" class="mt-3 w-100" color="primary" variant="outlined" @click="openSelectTemp">
                <span v-if="temp_name">
                    {{ temp_name }}
                </span>
                <span v-else>
                    {{ $t('useTemplate') }}
                </span>
            </v-btn>

            <DialogBase width="60vw" height="80vh" v-model="selectTempModel" :color="isDark ? 
                'linear-gradient(to left, rgb(33, 33, 33), rgb(33, 40, 42))' : 
                'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'">
                <template #title>
                    <v-icon>mdi-select</v-icon>
                    {{ $t('modal.parameter-template-select') }}
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