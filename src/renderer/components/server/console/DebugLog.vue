<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType } from '../../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');    

const alllog:Ref<Array<string>> = ref([])

const debuglog = (message:string) => {
    if(message == undefined) return
    alllog.value.push(message)
    if(alllog.value.length > 1000){
        alllog.value.shift()
    }
}

const clearMessage = () => {
    alllog.value = []
}

onMounted(() => {
    emitter?.on('debuglog', debuglog)
})

onUnmounted(() => {
    emitter?.off('debuglog', debuglog)
})

</script>

<template>
    <v-container fluid class="pt-4 text-white bg-black text-left" style="height: calc(100vh - 150px); overflow-y: auto; line-height: 18px;">
        <div class="float_button text-white" style="z-index: 5;">
            <v-btn-group>
                <v-btn color="primary" @click="clearMessage">{{ $t('clear') }}</v-btn>
            </v-btn-group>
        </div>
        <p v-for="(msg, i) in alllog" :key="i">{{ msg }}</p>
    </v-container>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 150px;
    right: 60px;
}
</style>
