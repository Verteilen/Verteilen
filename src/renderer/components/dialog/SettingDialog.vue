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
const themes = ref(["dark", "light"])

const buffer:Ref<Preference | undefined> = ref(undefined)
const lan:Ref<Array<string>> = ref(['en', 'zh_TW'])
const tag = ref(0)

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
        <v-card :style="{ 'fontSize': props.item?.font + 'px' }"
            :class="{ 'bg-dark': props.item?.theme == 'dark', 'bg-light': props.item?.theme == 'light' }">
            <v-card-title>
                <v-icon>mdi-cog</v-icon>
                {{ $t('toolbar.setting') }}
            </v-card-title>
            <v-card-text v-if="buffer" style="min-height: 50vh;">
                <v-container fluid class="pa-0 ma-0">
                    <v-tabs v-model="tag" tabs show-arrows>
                        <v-tab :value="0" :style="{ 'fontSize': props.item?.font + 'px' }">
                            {{ $t('settings.system') }}
                        </v-tab>
                        <v-tab :value="1" :style="{ 'fontSize': props.item?.font + 'px' }">
                            {{ $t('settings.appearance') }}
                        </v-tab>
                        <v-tab :value="2" :style="{ 'fontSize': props.item?.font + 'px' }">
                            {{ $t('settings.workflow') }}
                        </v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="tag" class="pt-4">
                        <v-tabs-window-item :value="0">
                            <v-select hide-details :label="$t('menu.language')" v-model="buffer.lan" :items="lan"></v-select>
                        </v-tabs-window-item>
                        <v-tabs-window-item :value="1">
                            <v-select v-model="buffer.theme" :items="themes" hide-details />
                            <br />
                            <v-slider :min="12" :max="36" :step="1" hide-details :label="$t('menu.font') + ' ' + buffer.font" v-model="buffer.font"></v-slider>
                        </v-tabs-window-item>
                        <v-tabs-window-item :value="2">
                            <v-checkbox hide-details :label="$t('menu.log')" v-model="buffer.log"></v-checkbox>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-container>
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="success" style="background-position: ;" @click="confirm">
                    {{ $t('confirm') }}
                </v-btn>
                <v-btn color="danger" @click="close">
                    {{ $t('close') }}
                </v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.bg-dark {
    background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(42, 33, 35));
}
.bg-light {
    background-image: linear-gradient(to bottom, rgb(240, 240, 240), rgb(255, 238, 242));
}
</style>