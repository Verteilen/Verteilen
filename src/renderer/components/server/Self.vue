<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { ClientLog, Preference } from '../../interface';
import { BackendProxy } from '../../proxy';

interface PROPS {
    backend: BackendProxy
    preference: Preference
    messages: Array<ClientLog>
}
const props = defineProps<PROPS>()
const emits = defineEmits<{
  (e: 'clean'):void
}>()
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const panel:Ref<Array<number>> = ref([0])
const autoScroll = ref(true)

const msgAppend = () => {
  if(autoScroll.value) myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
}

const clearMessage = () => {
  emits('clean')
  panel.value = [0]
}

onMounted(() => {
  props.backend.wait_init().then(() => {
    props.backend.eventOn('msgAppend', msgAppend);
  })
})

onUnmounted(() => {
    props.backend.eventOff('msgAppend', msgAppend);
})

</script>

<template>
  <v-container fluid>
    <div class="float_button text-white" style="z-index: 5;">
      <v-btn-group>
        <v-btn color="primary" @click="panel = []">{{ $t('close-all') }}</v-btn>
        <v-btn :color="autoScroll ? 'success' : 'error'" @click="autoScroll = !autoScroll">{{ $t('auto-scroll') }}</v-btn>
        <v-btn color="primary" @click="clearMessage">{{ $t('clear') }}</v-btn>
      </v-btn-group>
    </div>
    <div class="flow text-white" ref="myDiv">
      <v-expansion-panels multiple v-model="panel">
        <v-expansion-panel v-for="(block, i) in props.messages" :key="i" style="background: transparent">
          <v-expansion-panel-title color="grey-darken-3">
            <h3>{{ block.title }}</h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <br />
            <p class="messages" v-for="(msg, j) in block.text" :key="j">
              {{ msg }}
            </p>
            <br />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-container>
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
  overflow-y: scroll;
  text-align: left;
}
.messages {
  line-height: 18px;
}
</style>
