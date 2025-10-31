<script setup lang="ts">
import { inject, Ref } from 'vue';
import { Preference } from '../../interface';

export interface PROPS {
    width?: string
    height?: string
    persistent?:boolean
    color?:string
    nocard?: boolean
}
const preference:Ref<Preference> = inject('preference')!
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
</script>

<template>
    <v-dialog :width="props.width ?? '500'" :height="props.height ?? undefined" v-model="modal" class="text-white" 
        :persistent="props.persistent ?? false"
        :scrim="preference?.animation" 
        :no-click-animation="preference?.animation">
        <slot></slot>
        <v-card v-if="!nocard" :style="{ 'background': color ? color : '' }">
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