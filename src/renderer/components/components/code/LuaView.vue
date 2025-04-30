<script setup lang="ts">
import { autocompletion } from '@codemirror/autocomplete';
import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { Codemirror } from 'vue-codemirror';

const data = defineModel<string>({required: true})

const extensions = [basicSetup, StreamLanguage.define(lua), autocompletion(), oneDark]

</script>
<template>
    <Codemirror 
        v-model="data" 
        placeholder="Code goes here..."
        :style="{ height: '400px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"/>
</template>