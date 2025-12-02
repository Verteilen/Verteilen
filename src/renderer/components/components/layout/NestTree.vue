<script lang="ts" setup>
import { BusType, JobTable, KeyValue, TaskLogicType } from 'verteilen-core/dist/interface';
import { i18n } from '../../../plugins/i18n';
import { ViewTreeNode } from '../../server/Job';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { Emitter } from 'mitt';

import { VueDraggableNext } from 'vue-draggable-next'

interface PROPS {
    items: Array<ViewTreeNode>
    jobs: Array<JobTable>
    types: Array<any>
    types2: Array<any>
    categorise: Array<any>
    layer?: number
}
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e:'changed'):void
    (e: 'edit', uuid:string):void
    (e: 'delete', uuid:string):void
    (e: 'clean-selection'):void
}>()
const items:Ref<Array<KeyValue>> = ref([])

const updateLocate = () => {
    items.value = Object.keys(TaskLogicType).filter(key => isNaN(Number(key))).map((x, index):KeyValue => {
        return {
            key: $t(`condition.${x.toLowerCase()}`),
            value: index
        }
    })
}

const get_title = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.title ?? 0
}
const get_category = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.category ?? 0
}
const get_type = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.type ?? 0
}
const get_group_name = (node:ViewTreeNode):string => {
    if(node.title == '4') return ''
    return items.value.find(x => x.value == node.title)?.key ?? ''
}

const group_display = (item:ViewTreeNode):boolean => {
    if(item.type == TaskLogicType.SINGLE) return false
    return item.open == true
}

onMounted(() => {
    updateLocate()
    emitter.on('updateLocate', updateLocate)
})

onUnmounted(() => {
    emitter.off('updateLocate', updateLocate)
})
</script>

<template>    
    <div>
        <VueDraggableNext class="dragArea" tag="ul" :list="props.items" :group="{ name: 'g1' }"
            :move="() => emits('changed')">
            <li v-for="(item, index) in props.items" class="d-flex flex-wrap" :key="'nest'+index" style="min-height: 30px">
                <!-- Toggle -->
                <v-btn v-if="item.type != TaskLogicType.SINGLE" variant="text" 
                    :icon="!item.open ? 'mdi-chevron-right' : 'mdi-chevron-down'" @click="item.open = !item.open"></v-btn>
                <div v-else class="ml-6"><v-icon class="pt-6 pr-6">mdi-circle-medium</v-icon></div>
                <!-- Prepend -->
                <span class="mx-1 pt-3" v-if="item.id.length > 1">{{ item.id.slice(item.id.length - 12, item.id.length) }}</span>
                <span class="mx-1 pt-3" v-if="item.id.length <= 1">{{ get_group_name(item) }}</span>
                <span class="mx-1 pt-3" v-if="item.id.length > 0 && get_category(item.id) == 1">{{ props.types[get_type(item.id)]?.text }}</span>
                <span class="mx-1 pt-3" v-if="item.id.length > 0 && get_category(item.id) == 0">{{ props.types2[get_type(item.id)]?.text }}</span>
                <span class="mx-1 pt-3" v-if="item.id.length > 0">{{ props.categorise[get_category(item.id)]?.text }}</span>
                <span class="mx-1 pt-3" v-if="item.id.length > 0">{{ get_title(item.id) }}</span>
                <div class="me-auto"></div>
                <!-- Append -->
                <v-btn class="pt-3" variant="text" prepend-icon="mdi-pencil" :disabled="item.id.length <= 1" @click="emits('edit', item.id)">{{ $t('edit') }}</v-btn>
                <v-btn class="pt-3" variant="text" prepend-icon="mdi-delete" color="error" @click="emits('delete', item.id)">{{ $t('delete') }}</v-btn>
                <div class="w-100"></div>
                <!-- Children -->
                <nest-tree v-if="group_display(item)" :layer="(props.layer ?? 0) + 1"
                    :items="item.children ?? []"
                    :jobs="props.jobs" 
                    :types="props.types" 
                    :types2="props.types2" 
                    :categorise="props.categorise"
                    class="pl-5 mb-2 w-100"
                    @changed="emits('changed')"
                    @clean-selection="emits('clean-selection')"
                    @edit="id => emits('edit', id)"
                    @delete="id => emits('delete', id)">
                </nest-tree>
            </li>
        </VueDraggableNext>
    </div>
</template>

<style scoped>
.dragArea {
    min-height: 50px;
    outline: 1px solid #AFAFAF;
    border-radius: 0.7rem;
    padding-bottom: 6px;
}
</style>