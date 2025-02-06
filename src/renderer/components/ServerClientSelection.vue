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
    <div style="margin: 0; padding-top: 35vh; width: 80vw; height: 80vh; place-items: center;">
        <p>你擔任的角色</p>
        <div class="row">
            <div class="col">
                <b-button class="w-100 h-100 mx-1" @click="serverClick">伺服器</b-button>
            </div>
            <div class="col">
                <b-button class="w-100 h-100 mx-1" @click="clientClick">節點</b-button>    
            </div>
        </div>
    </div>
</template>

<style scoped>
body {
    place-items: center;
}
</style>
