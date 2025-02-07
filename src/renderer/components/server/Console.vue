<script setup lang="ts">
import { ref } from 'vue';

const headerState = ref(0)

</script>

<template>
    <div>
        <b-card no-body ag="article" class="my-3 w-50" style="margin-left: 25%;">
            <b-card-header>
                <span class="mx-2">執行狀態</span> 
                <b-spinner v-if="headerState == 0" small label="Small Spinner"></b-spinner>
                <IMdiCheck v-else-if="headerState == 1" />
                <IMdiStopwatchPauseOutline v-else-if="headerState == 2" />
            </b-card-header>
            <b-card-text>
                <p>Test </p>
                <b-icon icon="exclamation-circle-fill" variant="success"></b-icon>
                <b-icon icon="exclamation-circle-fill" variant="success"></b-icon>
                <b-icon icon="exclamation-circle-fill" variant="warning"></b-icon>
                <b-icon-arrow-up></b-icon-arrow-up>
                <p class="h1 mb-2">Icon <b-icon icon="exclamation-circle-fill"></b-icon></p>
                <IMdiAccessPointOff />
            </b-card-text>
        </b-card>
    </div>
</template>

<style scoped>

</style>
