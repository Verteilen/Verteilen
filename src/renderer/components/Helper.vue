<script setup lang="ts">

const model = defineModel<boolean>()

</script>

<template>
    <b-modal v-model="model" title="工具使用說明" size="lg" style="max-height: 100vh;" hide-footer>
        <b-card>
            <b-card-title>
                <h3>大綱</h3>
            </b-card-title>
            <b-card-text>
                這項工具將要執行的事項分成三種階層, <br />
                分別是專案, 流程, 跟工作 <br />
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>專案</h3>
            </b-card-title>
            <b-card-text>
                能將不同的大項目分開, 在執行階段的時候會選擇單一專案進行執行 <br />
                當然用戶也可以排序多個專案, 讓他一個專案一個專案執行 <br/>
                <br/>
                每個專案都能夠設定動態參數, 這些參數都是可以被讀寫的存在 <br />
                專案會擁有多個流程, 執行階段會按照順序一個一個流程運算 <br />
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>流程</h3>
            </b-card-title>
            <b-card-text>
                主要流程有兩種, 單一運算與群集運算 <br /><br />
                <h5>單一運算:</h5>
                會從節點中找一台電腦運算, 其他的空閒電腦會等待他執行完成 <br />
                直到下一個流程為群集的運算, 否則會一直會處在於一台電腦運算的情況 <br /><br />
                <h5>群集運算:</h5>
                這種模式下會需要用戶定義要依照哪一個數字參數為主進行運算 <br />
                在運算的過程會按照順序運算, 直到每一個作業完成
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>參數</h3>
            </b-card-title>
            <b-card-text>
                總共支援三種資料型態 <br />
                數字, 字串, 布林 <br />
                這些參數能透過 <span>{</span><span>{</span>變數名稱<span>}</span><span>}</span> 進行欄位存取 <br />
                在 Lua 則是要透過函式呼叫, 這一部分資訊會在文件上詳細敘述
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>工作</h3>
            </b-card-title>
            <b-card-text>
                流程下要執行的單一作業統稱 <br />
                工作的模式許多種, 如果項目裡無法滿足於運算需求 <br />
                可以透過 Lua 腳本語言的方式, 將詳細的邏輯寫出來
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>節點</h3>
            </b-card-title>
            <b-card-text>
                運算使用的電腦連線
            </b-card-text>
        </b-card>
        <b-card>
            <b-card-title>
                <h3>運算</h3>
            </b-card-title>
            <b-card-text>
                ssss
            </b-card-text>
        </b-card>
    </b-modal>
</template>

<style scoped>

</style>
