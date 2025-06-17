<script setup lang="ts">
import { PluginPageData } from '../../interface';

interface PROP {
    plugin: PluginPageData
}

const props = defineProps<PROP>()

</script>

<template>
    <div>
        <div class="py-3">
            <p>Plugin</p>
        </div>
    </div>
</template>