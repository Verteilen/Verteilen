<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject } from 'vue';
import { AppConfig, BusType, Preference, ToastData } from '../interface';
import { i18n } from './../plugins/i18n';

interface PROPS {
    config: AppConfig
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const propss = defineProps<PROPS>()
const data = defineModel<number>()

const serverClick = () => {
    const d:ToastData = {
        title: i18n.global.t("toast.server"),
        type: "primary",
        message: i18n.global.t("toast.server_d")
    }
    emitter?.emit('makeToast', d)
    data.value = 1
    if (propss.config.isElectron){
        window.electronAPI.send('modeSelect', false)
    } 
}

const clientClick = () => {
    const d:ToastData = {
        title: i18n.global.t("toast.node"),
        type: "primary",
        message: i18n.global.t("toast.node_d")
    }
    emitter?.emit('makeToast', d)
    emitter?.emit('modeSelect', true);
    data.value = 0
}

</script>

<template>
    <div class="text-white bg-grey-darken-4" style="margin: 0; padding:35vh 10vw; width: 100vw; height: 100vh; place-items: center;">
        <h3 :style="{ 'fontSize': (propss.preference.font + 6) + 'px' }">{{ $t('modeselect.title') }}</h3>
        <br />
        <v-row>
            <v-col>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" id="tooltip-server-1" class="w-100 mx-1" @click="serverClick()">
                            <span :style="{ 'fontSize': propss.preference.font + 'px' }">
                                {{ $t('server') }}
                            </span>
                        </v-btn>
                    </template>
                    <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-server') }}</p>
                </v-tooltip>
            </v-col>
            <v-col>
                <v-tooltip location="bottom" text="Tooltip">
                    <template v-slot:activator="{ props }">
                        <v-btn color="primary" v-bind="props" class="w-100 mx-1" @click="clientClick()">
                            <span :style="{ 'fontSize': propss.preference.font + 'px' }">
                                {{ $t('node') }}
                            </span>
                        </v-btn>    
                    </template>
                    <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-node') }}</p>
                </v-tooltip>
            </v-col>
        </v-row>
    </div>
</template>

<style lang="scss">

</style>

<style scoped>
body {
    place-items: center;
}
</style>
