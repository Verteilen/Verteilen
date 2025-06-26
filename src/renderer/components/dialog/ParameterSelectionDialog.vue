<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Parameter } from '../../interface';

const model = defineModel<boolean>()
const props = defineProps<{
    items: Array<Parameter>
}>()
const search = ref('')
const emits = defineEmits<{
    (e: 'select', v:Parameter | undefined): void
    (e: 'select_uuid', v:string): void
}>()

watch(() => model.value, () => {
    search.value = ''
})

const item_result = computed(() => {
    return props.items.filter(x => x.title.includes(search.value) || x.uuid.includes(search.value))
})

const selectParameter = (uuid: string) => {
    emits('select', props.items.find(x => x.uuid == uuid))
    emits('select_uuid', uuid)
    model.value = false
}

</script>

<template>
    <v-dialog width="500" v-model="model" class="text-white">
        <v-card>
            <v-card-title>
                <v-icon>mdi-pen</v-icon>
                {{ $t('parameter-select') }}
            </v-card-title>
            <v-card-text>
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
                            <v-btn color="grey-lighten-1" icon="mdi-arrow-right" variant="text" @click="selectParameter(p.uuid);"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>