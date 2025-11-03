<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt';
import { BusType, Preference } from 'verteilen-core/src/interface';
import { i18n } from './../../../plugins/i18n';
import { inject, Ref } from 'vue';
//#endregion

//#region Data
interface PROP {
    show_icon?: boolean
    title?: string
    logout?: boolean
    goback?: boolean
}
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROP>()
const emit = defineEmits<{
    (e: 'click'):void
}>()
//#endregion

//#region Methods
const popSetting = () => { emitter.emit('setting') }
const popGuide = () => { emitter.emit('guide') }
const popLogout = () => { emitter.emit('logout') }
const popGoBack = () => {
    preference.value.mode = undefined
    preference.value.url = undefined
    emitter.emit('savePreference', preference.value)
}
const click = () => {
    emit('click')
}
//#endregion
</script>

<template>
    <!-- Top Appbar -->
    <v-layout>
        <v-app-bar :elevation="2">
            <template v-slot:prepend>
                <v-app-bar-nav-icon v-if="show_icon" nav-icon @click="click"></v-app-bar-nav-icon>
            </template>
            <v-app-bar-title>
                <slot name="title">{{ title }}</slot>
            </v-app-bar-title>
            <template v-slot:append>
                <v-menu location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
                    </template>
                    <v-list width="120px">
                        <v-list-item @click="popGuide">{{ $t('guide') }}</v-list-item>
                        <v-list-item @click="popSetting">{{ $t('setting') }}</v-list-item>
                        <v-list-item v-if="props.logout" @click="popLogout">{{ $t('logout') }}</v-list-item>
                        <v-list-item v-if="props.goback" @click="popGoBack">{{ $t('goback') }}</v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-app-bar>
        <slot></slot>
    </v-layout>
</template>