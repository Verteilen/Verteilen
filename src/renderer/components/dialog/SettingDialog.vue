<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import { Preference } from '../../interface';
import DialogBase from './DialogBase.vue';

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
const tokenModal = ref(false)
const deleteModal = ref(false)
const tokenSelect = ref('')
const tokenName = ref('')
const tokenContent = ref('')

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

const createToken = () => {
    tokenName.value = ""
    tokenContent.value = ""
    tokenModal.value = true
}

const removeToken = () => {
    deleteModal.value = true
}

const createConfirm = () => {
    if(buffer.value == undefined) return
    buffer.value.plugin_token.push({
        name: tokenName.value,
        token: tokenContent.value,
    })
    tokenModal.value = false
}

const removeConfirm = () => {
    if(buffer.value == undefined) return
    const index = buffer.value.plugin_token.findIndex(x => x.name == tokenSelect.value)
    if(index != undefined && index != -1){
        buffer.value?.plugin_token.splice(index, 1)
        deleteModal.value = false
    }
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
                            <br />
                            <v-toolbar density="compact" class="pr-3">
                                <v-btn icon @click="createToken">
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                                <v-btn icon color="error" @click="removeToken" :disabled="tokenSelect.length > 0">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </v-toolbar>
                            <v-list>
                                <v-list-item v-for="(item, index) in buffer.plugin_token" 
                                    :key="index" 
                                    :activate="item.name == tokenSelect"
                                    @click="tokenSelect = item.name">
                                    <v-list-item-title>
                                        {{ item.name }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
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
                <DialogBase v-model="tokenModal" persistent>
                    <template #title>
                        <v-icon>mdi-lock</v-icon>
                    </template>
                    <template #text>
                        <v-text-field v-model="tokenName" class="my-1" label="name" hide-details></v-text-field>
                        <v-text-field v-model="tokenContent" class="my-1" label="token" hide-details></v-text-field>
                    </template>
                    <template #action>
                        <v-btn variant="text" color="primary" @click="createConfirm">{{ $t('confirm') }}</v-btn>
                        <v-btn variant="text" color="error" @click="tokenModal = false">{{ $t('cancel') }}</v-btn>
                    </template>
                </DialogBase>
                <DialogBase v-model="deleteModal">
                    <template #title>
                        <v-icon>mdi-delete</v-icon>
                    </template>
                    <template #action>
                        <v-btn class="mt-3" color="primary" @click="deleteModal = false">{{ $t('cancel') }}</v-btn>
                        <v-btn class="mt-3" color="error" @click="removeConfirm">{{ $t('delete') }}</v-btn>
                    </template>
                </DialogBase>
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

<style scoped>
.bg-dark {
    background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(42, 33, 35));
}
.bg-light {
    background-image: linear-gradient(to bottom, rgb(240, 240, 240), rgb(255, 238, 242));
}
</style>