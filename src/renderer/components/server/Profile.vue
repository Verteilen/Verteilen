<script setup lang="ts">
import { BackendProxy } from '../../proxy';

interface PROPS {
    backend: BackendProxy
}

const propss = defineProps<PROPS>()

const selectPicture = () => {

}

</script>

<template>
    <v-container fluid class="ma-0 pa-0">
        <div class="py-3">
            <v-row>
                <v-col cols="4">
                    <v-img cover :src="propss.backend.user?.picture_url ?? '/icon/user.png'" @click="selectPicture">
                    </v-img>
                </v-col>
                <v-col cols="8">
                    <v-text-field v-model="propss.backend.user!.name" label="Label" variant="outlined"></v-text-field>
                    <v-text-field v-model="propss.backend.user!.description" label="Label" variant="outlined"></v-text-field>
                </v-col>
            </v-row>
        </div>
    </v-container>
</template>