<script setup lang="ts">
const modal = defineModel<boolean>({ required: true })
const props = defineProps<{
    width?: string
    height?: string
    persistent?:boolean
    color?:string
}>()
</script>

<template>
    <v-dialog :width="props.width ?? '500'" :height="props.height ?? undefined" v-model="modal" class="text-white" :persistent="props.persistent ?? false">
        <v-card :style="{ 'background': color ? color : '' }">
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