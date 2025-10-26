<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt';
import { BusType } from 'verteilen-core/src/interface';
import { inject } from 'vue';
//#endregion

//#region Data
interface PROP {
    logout?: boolean
}
const emitter:Emitter<BusType> = inject('emitter')!
const props = defineProps<PROP>()
//#endregion

//#region Methods
const popSetting = () => { emitter?.emit('setting') }
const popGuide = () => { emitter?.emit('guide') }
const popLogout = () => { emitter?.emit('logout') }
//#endregion
</script>

<template>
    <!-- Top Appbar -->
    <v-layout>
        <v-app-bar :elevation="2">
            <v-app-bar-title>{{ $t('modeselect.titlebar') }}</v-app-bar-title>
            <template v-slot:append>
                <v-menu location="left">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
                    </template>
                    <v-list width="120px">
                        <v-list-item @click="popGuide">{{ $t('guide') }}</v-list-item>
                        <v-list-item @click="popSetting">{{ $t('setting') }}</v-list-item>
                        <v-list-item v-if="props.logout" @click="popLogout">{{ $t('logout') }}</v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-app-bar>
    </v-layout>
</template>