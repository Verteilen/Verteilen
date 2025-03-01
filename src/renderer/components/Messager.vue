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
    const data:Array<IMessage> = []
    for (let index = 0; index < messages.value.length; index++) {
        const element = messages.value[index];
        element.timer -= 1
        if(element.timer > 0 && element.ison) data.push(element)
    }
    messages.value = data
}

onMounted(() => {
	emitter?.on('makeToast', makeToast)
    emitter?.on('updateHandle', updateToast)
})

onUnmounted(() => {
	emitter?.off('makeToast', makeToast)
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
