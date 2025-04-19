<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref, Ref } from 'vue';
import { BusType, IMessage, Preference, RENDER_UPDATETICK, ToastData } from '../interface';
import { GetColor } from '../plugins/vuetify';

interface PROPS {
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const props = defineProps<PROPS>()
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

const shadeColor = (color:string, percent:number) => {

    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt((R * (100 + percent) / 100).toString());
    G = parseInt((G * (100 + percent) / 100).toString());
    B = parseInt((B * (100 + percent) / 100).toString());

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)

    let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

const update = () => {
    messages.value.forEach(x => {
        x.timer -= RENDER_UPDATETICK
        x.ison = x.timer > 0
    })
    messages.value = messages.value.filter(x => x.ison)
}

const darken = (color: string) => {
    const e = GetColor(color)
    return e == undefined ? color : shadeColor(GetColor(color), -50)
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
        <v-slide-y-transition group hide-on-leave>
            <v-alert vertical class="pa-2 ma-0" disabled
                v-for="(m, i) in messages"  :key="i" 
                location="start bottom"
                absolute
                offset="500"
                v-model="m.ison" 
                :timeout="m.timer" 
                color="transparent"
                variant="flat">
                <v-card class="pa-2 ma-0" variant="flat" elevation="16" :color="darken(m.variant)" style="border-width: 2px;">
                    <v-card-title :style="{ 'fontSize': (props.preference.font + 6) + 'px' }">
                        {{ m.title }}
                    </v-card-title>
                    <v-card-text :style="{ 'fontSize': props.preference.font + 'px' }">
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
