<script setup lang="ts">
import { computed, inject, Ref } from 'vue';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { Preference } from 'verteilen-core/dist/interface';

export interface PROPS {
    width?: string
    height?: string
    persistent?:boolean
    color?:string
    nocard?: boolean
}
const preference:Ref<Preference> = inject('preference')!
const theme = useTheme()
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const isDark = computed(() => theme.global.name.value == "dark")
const resultColor = computed(() => props.color != undefined ? props.color : (isDark ? 
        'linear-gradient(to left, rgb(33, 33, 33), rgb(33, 40, 42))' : 
        'linear-gradient(to left, rgb(235, 235, 235), rgb(235, 242, 255))'))
</script>

<template>
    <v-dialog :width="props.width ?? '500'" :height="props.height ?? undefined" v-model="modal" class="text-white"
        :persistent="props.persistent ?? false"
        :scrim="preference?.animation" 
        :no-click-animation="preference?.animation">
        <slot></slot>
        <v-card v-if="!nocard" :style="{ 'background': resultColor }">
            <v-card-title>
                <slot name="title"></slot>
            </v-card-title>
            <v-card-text>
                <slot name="text"></slot>
            </v-card-text>
            <template v-slot:actions>
                <slot name="action"></slot>
            </template>
        </v-card>
    </v-dialog>
</template>