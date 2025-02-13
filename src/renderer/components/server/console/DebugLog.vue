<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType } from '../../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const alllog:Ref<Array<string>> = ref([])

const debuglog = (message:string) => {
    alllog.value.push(message)
}

onMounted(() => {
    emitter?.on('debuglog', debuglog)
})

onUnmounted(() => {
    emitter?.off('debuglog', debuglog)
})

</script>

<template>
    <b-container class="pt-4 text-white bg-black text-left" style="height: 90vh; overflow-y: auto; line-height: 15px;">
        <p v-for="(msg, i) in alllog" :key="i">{{ msg }}</p>
    </b-container>
</template>

<style scoped>

</style>
