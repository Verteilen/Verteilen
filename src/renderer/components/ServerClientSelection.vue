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
        <p>{{ $t('modeselect.title') }}</p>
        <br />
        <div class="row">
            <div class="col">
                <b-button class="w-100 h-100 mx-1" @click="serverClick">{{ $t('server') }}</b-button>
            </div>
            <div class="col">
                <b-button class="w-100 h-100 mx-1" @click="clientClick">{{ $t('node') }}</b-button>    
            </div>
        </div>
    </div>
</template>

<style scoped>
body {
    place-items: center;
}
</style>
