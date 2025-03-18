<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, DataType, DataTypeText, Parameter } from '../../../interface';
import { i18n } from '../../../plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const data = defineModel<Parameter>()
const fields:Ref<Array<any>> = ref([
    { title: 'Name', align: 'center', key: 'name' },
    { title: 'Type', align: 'center', key: 'type' },
    { title: 'Value', align: 'center', key: 'value' },
])
const options:Ref<Array<{ title: string, value:number }>> = ref([])

const d:Ref<Parameter | undefined> = ref(undefined)

watch(() => data.value, () => {
    d.value = undefined
    nextTick(() => {
        d.value = data.value
    })
})

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
})

onUnmounted(() => {
    emitter?.off('updateLocate', updateLocate)
})

</script>

<template>
    <v-container v-if="d != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <v-data-table :items="d.containers" :headers="fields" item-key="name">
            <template v-slot:item.type="item">
                <v-chip>{{ DataTypeTranslate(item.value) }}</v-chip>
            </template>
        </v-data-table>
    </v-container>
</template>

<style scoped>

</style>
