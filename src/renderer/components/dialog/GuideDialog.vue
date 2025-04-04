<script setup lang="ts">
    const modal = defineModel<boolean>({ required: true })
</script>

<template>
    <v-dialog width="800" v-model="modal" class="text-white text-center">
        <v-card>

        </v-card>
    </v-dialog>
</template>