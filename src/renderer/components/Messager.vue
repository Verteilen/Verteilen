<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref, Ref } from 'vue';
import { BusType, IMessage, ToastData } from '../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const messages:Ref<Array<IMessage>> = ref([])
let updateToastHandle:number = -1

const makeToast = (e:ToastData) => {
    console.log("Hello");
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
    updateToastHandle = setInterval(updateToast, 1000)
})

onUnmounted(() => {
    clearInterval(updateToastHandle)
})

</script>

<template>
    <div class="position-fixed fixed-bottom">
        <b-toast v-for="m in messages" class="m-3 rounded-0" v-model="m.ison" :title="m.title" :variant="m.variant">
            {{ m.content }}
        </b-toast>
    </div>
    
</template>


<style scoped>

</style>
