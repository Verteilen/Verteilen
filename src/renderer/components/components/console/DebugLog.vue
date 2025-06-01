<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, MESSAGE_LIMIT, Preference } from '../../../interface';

interface PROPS {
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');    

    const props = defineProps<PROPS>()
const alllog:Ref<Array<string>> = ref([])

const debuglog = (message:string) => {
    if(message == undefined) return
    alllog.value.push(message)
    if(alllog.value.length > MESSAGE_LIMIT){
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
    <v-container fluid class="pt-0 px-0 text-white bg-black text-left" style="height: calc(100vh - 150px); overflow-y: auto; line-height: 18px;">
        <v-toolbar density="compact" :style="{ 'fontSize': props.preference.font + 'px' }">
            <v-spacer></v-spacer>
            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" color="error" @click="clearMessage">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
                {{ $t('clear') }}
            </v-tooltip>
        </v-toolbar>
        <div class="pt-3 px-3 w-100" style="overflow-y:auto; height:calc(100% - 48px)">
            <p :style="{ 'fontSize': props.preference.font + 'px', 'line-height': props.preference.font + 'px' }" v-for="(msg, i) in alllog" :key="i">{{ msg }}</p>
        </div>
    </v-container>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 150px;
    right: 60px;
}
</style>
