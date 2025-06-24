<script setup lang="ts">
import { Ref, ref } from 'vue';
import { BackendProxy } from '../../proxy';
import { DATA } from '../../util/profile';
import { UserType } from '../../interface';

interface PROPS {
    backend: BackendProxy
}

const propss = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'modify', name:string, des:string): void
}>()
const data:Ref<DATA> = ref({
    importModal: false,
    importData: [],
    editMode: false,
    name: "",
    description: "",
})

const selectPicture = () => {
    data.value.importModal = true
}

const toggleButton = () => {
    if(data.value.editMode){
        emits('modify', data.value.name, data.value.description)
        const body = {
            name: data.value.name,
            description: data.value.description
        }
        const fe = fetch("user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)})
        fe.then(() => {
            propss.backend.init()
        })
        data.value.editMode = false
    }else{
        data.value.name = propss.backend.user?.name ?? ''
        data.value.description = propss.backend.user?.description ?? ''
        data.value.editMode = true
    }
}

const ImportConfirm = async () => {
    if(data.value.importData.length != 1) return
    const d = new FormData()
    d.append('pic', data.value.importData[0], "pic.png")
    fetch('pic', {
        method: "POST",
        body: d
    }).then(x => {
        propss.backend.init()
        data.value.importData = []
        data.value.importModal = false
    })
}

</script>

<template>
    <v-container fluid class="ma-0 pa-0">
        <div class="pa-5 mt-3">
            <v-row style="padding: 20px 10%;">
                <v-col cols="2" class="ma-0 pa-0">
                    <v-hover v-slot="{ isHovering, props }">
                        <v-card v-bind="props">
                            <v-img alt="Picture" cover :src="propss.backend.user.picture_url ? '/pic' : 'assets/icon/user.png'"></v-img>
                            <v-overlay :model-value="!!isHovering" contained class="align-center justify-center">
                                <v-btn @click="selectPicture" color="primary" variant="flat">{{ $t('modify') }}</v-btn>
                            </v-overlay>
                        </v-card>
                    </v-hover>
                </v-col>
                <v-col cols="10" class="pl-6">
                    <v-text-field v-if="!data.editMode" :disabled="true" v-model="propss.backend.user.name" :label="$t('profile.username')" variant="outlined"></v-text-field>
                    <v-text-field v-if="!data.editMode" :disabled="true" v-model="propss.backend.user.description" :label="$t('profile.description')" variant="outlined"></v-text-field>
                    <v-text-field v-if="data.editMode" v-model="data.name" :label="$t('profile.username')" variant="outlined"></v-text-field>
                    <v-text-field v-if="data.editMode" v-model="data.description" :label="$t('profile.description')" variant="outlined"></v-text-field>
                    <v-checkbox disabled v-model="propss.backend.config.isAdmin" :label="$t('profile.admin')"></v-checkbox>
                    <v-btn v-if="propss.backend.user != undefined" style="float: left" color="primary" @click="toggleButton"> {{ $t(data.editMode ? 'confirm' : 'modify') }} </v-btn>
                </v-col>
            </v-row>
            <v-dialog width="800" v-model="data.importModal" class="text-white">
                <v-card>
                    <v-card-title>
                        <v-icon>mdi-import</v-icon>
                        {{ $t('modal.upload-pic') }}
                    </v-card-title>
                    <v-card-text>
                        <v-file-upload v-model="data.importData" show-size clearable density="default"></v-file-upload>
                    </v-card-text>
                    <template v-slot:actions>
                        <v-btn class="mt-3" :disabled="data.importData == undefined" color="primary" @click="ImportConfirm">{{ $t('import') }}</v-btn>
                    </template>
                </v-card>
            </v-dialog>
        </div>
    </v-container>
</template>