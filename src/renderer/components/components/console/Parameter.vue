<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, DataType, DataTypeText, Parameter, Preference } from '../../../interface';
import { i18n } from '../../../plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    preference: Preference
}

const data = defineModel<Parameter>()
const props = defineProps<PROPS>()
const fields:Ref<Array<any>> = ref([
    { title: 'Name', align: 'center', key: 'name' },
    { title: 'Type', align: 'center', key: 'type' },
    { title: 'Value', align: 'center', key: 'value' },
])
const options:Ref<Array<{ title: string, value:number }>> = ref([])

const d:Ref<Parameter | undefined> = ref(undefined)

const update_runtime_parameter = () => {
    if(data.value != undefined) d.value = JSON.parse(JSON.stringify(data.value))
}

const DataTypeTranslate = (t:number):string => {
    return i18n.global.t(DataTypeText[t])
} 

const updateLocate = () => {
    options.value = Object.keys(DataType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            title: DataTypeTranslate(index),
            value: index
        }
    })
    options.value.push({ title: "All", value: -1 })
}

onMounted(() => {
    updateLocate()
    emitter?.on('updateLocate', updateLocate)
    emitter?.on('updateHandle', update_runtime_parameter)
})

onUnmounted(() => {
    emitter?.off('updateLocate', updateLocate)
    emitter?.off('updateHandle', update_runtime_parameter)
})

</script>

<template>
    <v-container v-if="d != undefined" class="pt-4" style="max-height: 85vh; overflow-y: auto;">
        <v-data-table style="background: transparent" :items="d.containers" :headers="fields" item-key="name" :style="{ 'fontSize': props.preference.font + 'px' }">
            <template v-slot:item.type="item">
                <v-chip>{{ DataTypeTranslate(item.value) }}</v-chip>
            </template>
        </v-data-table>
    </v-container>
</template>

<style scoped>

</style>
