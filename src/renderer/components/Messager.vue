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
            timer: 5000,
            title: e.title,
            content: e.message,
            variant: e.type   
        }
    )
}

onMounted(() => {
	emitter?.on('makeToast', makeToast)
})

onUnmounted(() => {
	emitter?.off('makeToast', makeToast)
})

</script>

<template>
    <div class="position-fixed fixed-bottom">
        <b-toast v-for="(m, i) in messages" :key="i" no-auto-hide class="m-3 rounded-0" v-model="m.ison" :title="m.title" :variant="m.variant" :auto-hide-delay="m.timer" :no-close-button="true">
            {{ m.content }}
        </b-toast>
    </div>
    
</template>

<style scoped>
.btn-close{
    filter: grayscale(1) invert(0);
}
</style>
