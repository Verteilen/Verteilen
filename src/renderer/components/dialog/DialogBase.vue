<script setup lang="ts">
const modal = defineModel<boolean>({ required: true })
const props = defineProps<{
    width?: string
    persistent?:boolean
}>()
</script>

<template>
    <v-dialog :width="props.width ?? '500'" v-model="modal" class="text-white" :persistent="props.persistent ?? false">
        <v-card>
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