<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, NodeTable, Single } from '../../interface';
import { WebsocketManager } from '../../script/socket_manager';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    item: NodeTable | undefined
    manager: WebsocketManager | undefined
}

const myDiv:Ref<HTMLDivElement | null> = ref(null);
const props = defineProps<PROPS>()
const modal = defineModel<boolean>({ required: true })
const consoleCommand = ref('')
const consoleMessages:Ref<Array<string>> = ref([])
const path = ref('')

watch(() => modal.value, () => {
    consoleCommand.value = ''
    consoleMessages.value = []
})

const closeConsole = () => {
    if(props.item == undefined) return
    modal.value = false
    props.manager?.shell_close(props.item.ID)
}

const cleanConsole = () => {
    consoleMessages.value = []
}

const sendCommand = () => {
    if(consoleCommand.value.length == 0 || props.item == undefined) return
    props.manager?.shell_enter(props.item.ID, consoleCommand.value)
    consoleCommand.value = ""
}

const shellReply = (data:Single) => {
    consoleMessages.value.push(data.data.toString())
    myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
}

const enterPath = () => {

}

onMounted(() => {
    emitter?.on('shellReply', shellReply)
})

onUnmounted(() => {
    emitter?.off('shellReply', shellReply)
})

</script>

<template>
    <v-dialog persistent width="90vw" v-model="modal" class="text-white">
        <v-card>
            <v-card-title>
                <v-icon>mdi-console</v-icon>
                {{ item?.ID }}
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="4">
                        <v-text-field hide-details density="compact" v-model="path" @keydown.enter="enterPath"></v-text-field>        
                        <v-list>

                        </v-list>
                    </v-col>
                    <v-col cols="8">
                        <div style="height: 50vh; overflow-y: scroll; font-size: 12px;" class="mb-1" ref="myDiv">
                            <p v-for="(c, i) in consoleMessages" :key="i">{{ c }}</p>
                        </div>
                        <v-row>
                            <v-col cols="10">
                                <v-text-field hide-details density="compact" v-model="consoleCommand" @keydown.enter="sendCommand"></v-text-field>        
                            </v-col>
                            <v-col cols="2">
                                <v-btn class="w-100" @click="cleanConsole">{{ $t('clean') }}</v-btn>
                            </v-col>
                        </v-row>
                        
                    </v-col>
                </v-row>
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="danger" @click="closeConsole">
                    {{ $t('close') }}
                </v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>