<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject } from 'vue';
import { BusType } from '../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const serverClick = () => {
    emitter?.emit('makeToast', {
        title: "伺服器模式",
        type: "primary",
        message: "用戶選擇了伺服器模式, 主控台出現後, 控制其他節點進行工作"
    })
    emitter?.emit('modeSelect', false);
    window.electronAPI.send('modeSelect', false)
    window.Electron
}

const clientClick = () => {
    emitter?.emit('makeToast', {
        title: "節點模式",
        type: "primary",
        message: "用戶選擇了節點模式, 被動架構的情況下無法做任意事件, 將會等待伺服器連線..."
    })
    emitter?.emit('modeSelect', true);
    window.electronAPI.send('modeSelect', true)
}

</script>

<template>
    <div class="text-white bg-grey-darken-4" style="margin: 0; padding:35vh 10vw; width: 100vw; height: 100vh; place-items: center;">
        <h5>{{ $t('modeselect.title') }}</h5>
        <br />
        <div class="row">
            <div class="col">
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <b-button v-bind="props" id="tooltip-server-1" class="w-100 h-100 mx-1" @click="serverClick">{{ $t('server') }}</b-button>
                    </template>
                    <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-server') }}</p>
                </v-tooltip>
            </div>
            <div class="col">
                <v-tooltip location="bottom" text="Tooltip">
                    <template v-slot:activator="{ props }">
                        <b-button v-bind="props" class="w-100 h-100 mx-1" @click="clientClick">{{ $t('node') }}</b-button>    
                    </template>
                    <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-node') }}</p>
                </v-tooltip>
            </div>
        </div>
    </div>
</template>

<style lang="scss">

</style>

<style scoped>
body {
    place-items: center;
}
</style>
