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

const props = defineProps<PROPS>()
const modal = defineModel<boolean>({ required: true })
const consoleCommand = ref('')
const consoleMessages:Ref<Array<string>> = ref([])

watch(() => modal.value, () => {
    consoleCommand.value = ''
    consoleMessages.value = []
})

const closeConsole = () => {
    if(props.item == undefined) return
    modal.value = false
    props.manager?.shell_close(props.item.ID)
}

const sendCommand = () => {
    if(consoleCommand.value.length == 0 || props.item == undefined) return
    props.manager?.shell_enter(props.item.ID, consoleCommand.value)
    consoleCommand.value = ""
}

const shellReply = (data:Single) => {
    consoleMessages.value.push(data.data.toString())
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

                    </v-col>
                    <v-col cols="8">
                        <div style="height: 50vh; overflow-y: scroll; font-size: 12px;" class="mb-1">
                            <p v-for="(c, i) in consoleMessages" :key="i">{{ c }}</p>
                        </div>
                        <v-text-field hide-details density="compact" v-model="consoleCommand" @keydown.enter="sendCommand"></v-text-field>        
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