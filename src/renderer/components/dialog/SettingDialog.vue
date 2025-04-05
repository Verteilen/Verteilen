<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import { Preference } from '../../interface';

interface PROPS {
    item: Preference | undefined
}

const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const emit = defineEmits<{
    (e: 'update', data:Preference):void,
    (e: 'close'):void
}>()

const buffer:Ref<Preference | undefined> = ref(undefined)
const lan:Ref<Array<string>> = ref(['en', 'zh_TW'])

watch(() => modal.value, () => {
    buffer.value = JSON.parse(JSON.stringify(props.item))
})

const confirm = () => {
    if(buffer.value != undefined)
    emit('update', buffer.value)
    modal.value = false
}

const close = () => {
    modal.value = false
}

</script>

<template>
    <v-dialog persistent width="600" v-model="modal" class="text-white">
        <v-card :style="{ 'fontSize': props.item?.font + 'px' }">
            <v-card-title>
                <v-icon>mdi-cog</v-icon>
                {{ $t('toolbar.setting') }}
            </v-card-title>
            <v-card-text v-if="buffer">
                <v-select hide-details :label="$t('menu.language')" v-model="buffer.lan" :items="lan"></v-select>
                <v-checkbox hide-details :label="$t('menu.log')" v-model="buffer.log"></v-checkbox>
                <v-slider :min="12" :max="36" :step="1" hide-details :label="$t('menu.font') + ' ' + buffer.font" v-model="buffer.font"></v-slider>
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="success" @click="confirm">
                    {{ $t('confirm') }}
                </v-btn>
                <v-btn color="danger" @click="close">
                    {{ $t('close') }}
                </v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>