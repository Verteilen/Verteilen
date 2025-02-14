<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref, Ref } from 'vue';
import { BusType, IMessage, ToastData } from '../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const messages:Ref<Array<IMessage>> = ref([])

const makeToast = (e:ToastData) => {
    messages.value.push(
        {
            ison: true,
            timer: 5,
            title: e.title,
            content: e.message,
            variant: e.type   
        }
    )
}

const updateToast = () => {
    messages.value.forEach(x => {
        x.timer -1
    })
    messages.value = messages.value.filter(x => x.timer > 0 && x.ison);
}

emitter?.on('makeToast', (e) => makeToast(e))

onMounted(() => {
    emitter?.on('updateHandle', updateToast)
})

onUnmounted(() => {
    emitter?.off('updateHandle', updateToast)
})

</script>

<template>
    <div class="position-fixed fixed-bottom">
        <b-toast v-for="(m, i) in messages" :key="i" class="m-3 rounded-0" v-model="m.ison" :title="m.title" :variant="m.variant" :no-close-button="true">
            {{ m.content }}
        </b-toast>
    </div>
    
</template>

<style scoped>
.btn-close{
    filter: grayscale(1) invert(0);
}
</style>
