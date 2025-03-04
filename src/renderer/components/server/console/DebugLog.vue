<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType } from '../../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');    

const alllog:Ref<Array<string>> = ref([])
const limit = ref(1000)

const debuglog = (message:string) => {
    if(message == undefined) return
    alllog.value.push(message)
    if(alllog.value.length > limit.value){
        alllog.value.splice(0, 1)
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
    <b-container fluid class="pt-4 text-white bg-black text-left" style="height: 90vh; overflow-y: auto; line-height: 15px;">
        <div class="float_button text-white" style="z-index: 5;">
            <b-button-group>
                <b-button variant="primary" @click="clearMessage">{{ $t('clear') }}</b-button>
            </b-button-group>
        </div>
        <p v-for="(msg, i) in alllog" :key="i">{{ msg }}</p>
    </b-container>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 70px;
    right: 60px;
}
</style>
