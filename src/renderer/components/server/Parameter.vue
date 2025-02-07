<script setup lang="ts">
import { ref } from 'vue';
import { Project } from '../../interface';

interface PROPS {
    select: Project | undefined
}

const props = defineProps<PROPS>()
const hasSelect = ref(false)
const createModal = ref(false)
const createData = ref({ temp: false, name: '', type: '字串' })
const types = ref(['字串', '數字', '布林'])

const createParameter = () => {
    createModal.value = true
}

const cloneSelect = () => {

}

const deleteSelect = () => {
    
}

const confirmCreate = () => {

}

</script>

<template>
    <div>
        <div class="my-3">
            <b-button-group>
                <b-button variant='primary' @click="createParameter" :disabled="select == undefined">新增</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">克隆</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">刪除</b-button>
            </b-button-group>
        </div>
        <b-card no-body ag="article" class="my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                當前選擇專案: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
            </b-card-text>
        </b-card>
        <hr />
        <b-modal title="新增參數" v-model="createModal" hide-footer>
            <b-form-checkbox v-model="createData.temp">使用樣板</b-form-checkbox>
            <div v-if="createData.temp">

            </div>
            <div v-else>
                <b-form-input class="mt-3" v-model="createData.name" required placeholder="輸入參數名稱"></b-form-input>
                <b-form-select class="mt-3" v-model="createData.type" :options="types"></b-form-select>
            </div>
            
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
