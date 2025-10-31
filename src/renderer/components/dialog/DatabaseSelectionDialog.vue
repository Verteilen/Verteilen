<script setup lang="ts">
//#endregion Modules
import { computed, ref, watch } from 'vue';
import { Database, Preference } from '../../interface';
import { i18n } from 'verteilen-core/src/plugins/i18n';
//#endregion

//#region Views
import DialogBase from './DialogBase.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const model = defineModel<boolean>()
const props = defineProps<{
    items: Array<Database>,
    preference?: Preference
}>()
const search = ref('')
const emits = defineEmits<{
    (e: 'select', v:Database | undefined): void
    (e: 'select_uuid', v:string): void
}>()
//#endregion

watch(() => model.value, () => {
    search.value = ''
})

const item_result = computed(() => {
    return props.items.filter(x => x.title.includes(search.value) || x.uuid.includes(search.value))
})

const selectDatabase = (uuid: string) => {
    emits('select', props.items.find(x => x.uuid == uuid))
    emits('select_uuid', uuid)
    model.value = false
}

</script>

<template>
    <DialogBase width="500" v-model="model!" class="text-white" :preference="props.preference">
        <template #title>
            <v-icon>mdi-pen</v-icon>
            {{ $t('database-select') }}
        </template>
        <template #text>
            <v-text-field :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search">
            </v-text-field>
            <v-list>
                <v-list-item v-for="(p, i) in [{ title: 'None', uuid: '' }, ...item_result]" :key="i">
                    <v-list-item-title>
                        {{ p.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ p.uuid }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                        <v-btn color="grey-lighten-1" icon="mdi-arrow-right" variant="text" @click="selectDatabase(p.uuid);"
                        ></v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </template>
    </DialogBase>
</template>