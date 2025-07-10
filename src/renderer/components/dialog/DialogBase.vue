<script setup lang="ts">
import { Preference } from '../../interface';

const modal = defineModel<boolean>({ required: true })
const props = defineProps<{
    width?: string
    height?: string
    persistent?:boolean
    color?:string
    preference?: Preference
    nocard?: boolean
}>()
</script>

<template>
    <v-dialog :width="props.width ?? '500'" :height="props.height ?? undefined" v-model="modal" class="text-white" 
        :persistent="props.persistent ?? false"
        :scrim="props.preference?.animation" 
        :no-click-animation="!props.preference?.animation">
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