<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref, Ref } from 'vue';
import { BusType, IMessage, RENDER_UPDATETICK, ToastData } from '../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const messages:Ref<Array<IMessage>> = ref([])

const makeToast = (e:ToastData) => {
    messages.value.push(
        {
            ison: true,
            timer: 5000,
            title: e.title,
            content: e.message,
            variant: e.type   
        }
    )
}

const update = () => {
    messages.value.forEach(x => {
        x.timer -= RENDER_UPDATETICK
        x.ison = x.timer > 0
    })
    messages.value = messages.value.filter(x => x.ison)
}

onMounted(() => {
    emitter?.on('updateHandle', update)
	emitter?.on('makeToast', makeToast)
})

onUnmounted(() => {
    emitter?.on('updateHandle', update)
	emitter?.off('makeToast', makeToast)
})

</script>

<template>
    <div class="notificationContainer">
        <v-slide-y-transition group>
            <v-alert vertical class="pa-2 ma-0" disabled
                v-for="(m, i) in messages"  :key="i" 
                location="start bottom"
                absolute
                offset="500"
                v-model="m.ison" 
                :timeout="m.timer" 
                variant="flat" 
                :color="m.variant" >
                <v-card class="pa-2 ma-0">
                    <v-card-title>
                        {{ m.title }}
                    </v-card-title>
                    <v-card-text>
                        {{ m.content }}
                    </v-card-text>
                </v-card>
            </v-alert>
        </v-slide-y-transition>
    </div>
    
</template>

<style scoped>
.notificationContainer {
    position: fixed;
    bottom: 10px;
    left: 10px;
    display: grid;
    grid-gap: 0.5em;
    z-index: 99;
}
</style>
