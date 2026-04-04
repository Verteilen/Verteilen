<script lang="ts" setup>
import { BuildinAssets, PluginContainer } from 'verteilen-core/dist/interface';
import { i18n } from '../../../plugins/i18n';
import DialogBase from '../DialogBase.vue';
import { computed, Ref, ref, watch } from 'vue';

interface PROPS {
    buildIn_plugin: BuildinAssets
    current: Array<PluginContainer>
}

const $t = i18n.global.t
const modal = defineModel<boolean>({ required: true })
const data = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'confirm', select:Array<number>):void
}>()
const select:Ref<Array<number>> = ref([])

const filter_list = computed(() => {
    return data.buildIn_plugin.data.filter(x => {
        const p = data.current.find(y => y.title == x.name)
        return p == undefined
    })
})

watch(() => modal, () => {
    select.value = []
})

const toggle = (index:number) => {
    const i = select.value.findIndex(x => x == index)
    if(i == -1) select.value.push(index)
    else select.value.splice(i, 1)
}
</script>

<template>
    <DialogBase v-model="modal">
        <template #title>
            <v-icon>mdi-import</v-icon>
            {{ $t('import-plugin') }}
        </template>
        <template #text>
            <v-list :selectable="false" :activatable="false" style="background-color: transparent;">
                <v-list-item v-for="(item, index) in filter_list" :key="index" :selectable="false" :activatable="false">
                    <template #prepend>
                        <v-checkbox class="mr-2" :Value="select.includes(index)" @update:model-value="toggle(index)" density="compact" hide-details></v-checkbox>
                    </template>
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </template>
        <template #action>
            <v-btn color="primary" @click="emits('confirm', select)">{{ $t('confirm') }}</v-btn>
        </template>
    </DialogBase>
</template>