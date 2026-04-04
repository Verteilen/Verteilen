<script lang="ts" setup>
//#region Modules
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { ClientLog, Preference } from 'verteilen-core/dist/interface';
import { i18n } from '../../../plugins/i18n';
import { BackendProxy } from '../../../proxy';
//#endregion

interface PROPS {
    /**
     * **Extra message sources**
     */
    messages: Array<ClientLog>
}
const $t = i18n.global.t
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'clean'):void
}>()
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const panel:Ref<Array<number>> = ref([])
const autoScroll = ref(true)

const msgAppend = () => {
    if(autoScroll.value) myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
}
/**
 * Remove all display message on views
 */
const clearMessage = () => {
    emits('clean')
    panel.value = [0]
}
/**
 * Toggle one of the message group
 * @param e Event
 * @param v ID
 */
const onToggle = (e:PointerEvent, v:number) => {
    e.preventDefault()
    const index = panel.value.findIndex(x => x == v)
    if (index != -1) panel.value.splice(index, 1)
    else panel.value.push(v)
}

onMounted(() => {
    console.log("Self Mounted")
    backend.value.wait_init().then(() => {
        backend.value.eventOn('msgAppend', msgAppend);
    })
})

onUnmounted(() => {
    backend.value.eventOff('msgAppend', msgAppend);
})
</script>

<template>
    <div>
        <v-toolbar density="compact" class="pr-3">
            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn color="primary" icon v-bind="props" @click="panel = []">
                        <v-icon>mdi-folder-arrow-up</v-icon>
                    </v-btn>
                </template>
                {{ $t('close-all') }}
            </v-tooltip>
            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" :color="autoScroll ? 'success' : 'error'" @click="autoScroll = !autoScroll">
                        <v-icon>mdi-pan-vertical</v-icon>
                    </v-btn>
                </template>
                {{ $t('auto-scroll') }}
            </v-tooltip>
            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn color="error" icon v-bind="props" @click="clearMessage">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
                {{ $t('clear') }}
            </v-tooltip>
        </v-toolbar>
        <div class="flow text-white px-6" ref="myDiv">
            <details :open="panel.includes(i)" @click="e => onToggle(e, i)" v-for="(block, i) in props.messages" :key="i" class="w-100 text-white mb-3 px-4 text-left" :style="{ backgroundColor: '#454545' }">
                <summary> {{ block.title }} </summary>
                <p class="pl-5 messages" v-for="(msg, j) in block.text" :key="j" :style="{ 'fontSize': preference.font + 'px', 'line-height': (preference.font * 2) + 'px' }">
                {{ msg }}
                </p>
            </details>
        </div>
    </div>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 80px;
    right: 20px;
}
.flow {
    padding-top: 20px;
    padding-left: 10px;
    height: calc(100vh - 100px);
    overflow-y: auto;
    text-align: left;
}
.messages {
    line-height: 18px;
}
</style>