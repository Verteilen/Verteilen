<script setup lang="ts">
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue'
import { i18n } from '../../plugins/i18n'
import { DATA } from '../../util/role'
import { Emitter } from 'mitt';
import { Preference, BusType, UserProfile } from '../../interface';

interface PROPS {
    preference: Preference
    items: Array<UserProfile>
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const props = defineProps<PROPS>()
const data:Ref<DATA> = ref({
    fields: []
})

const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID', width: "25%" },
        { title: i18n.global.t('headers.title'), align: 'center', key: 'title', width: "20%" },
        { title: i18n.global.t('headers.description'), align: 'center', key: 'description' },
        { title: i18n.global.t('headers.detail'), align: 'center', key: 'detail', width: "20%" },
    ]
}

const updateLocate = () => {
    updateFields()
}

onMounted(() => {
    updateLocate()
    updateFields()
    emitter?.on('updateLocate', updateLocate)
})

onUnmounted(() => {
    emitter?.off('updateLocate', updateLocate)
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">

            </v-toolbar>
        </div>
        <div class="pt-3">
            <v-data-table style="background: transparent" :headers="data.fields" show-select item-value="ID" :style="{ 'fontSize': props.preference.font + 'px' }">

            </v-data-table>
        </div>
    </div>
</template>