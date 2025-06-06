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
  <v-container fluid class="ma-0 pa-0 pt-4" style="height: 94vh">
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
    <div class="flow text-white" ref="myDiv">
      <v-expansion-panels multiple v-model="panel">
        <v-expansion-panel v-for="(block, i) in props.messages" :key="i" style="background: transparent">
          <v-expansion-panel-title color="grey-darken-3">
            <h3>{{ block.title }}</h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="messages" v-for="(msg, j) in block.text" :key="j" :style="{ 'fontSize': props.preference.font + 'px', 'line-height': (props.preference.font * 2) + 'px' }">
              {{ msg }}
            </p>
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
  overflow-y: auto;
  text-align: left;
}
.messages {
  line-height: 18px;
}
</style>
