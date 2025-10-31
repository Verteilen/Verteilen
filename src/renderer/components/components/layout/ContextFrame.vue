<template>
    <div>
        <div class="py-3">
            <slot name="toolbar"></slot>
        </div>
        <div class="py-0" style="height: calc(100vh - 130px); overflow-y: auto;">
            <slot></slot>
        </div>
        <slot name="dialog"></slot>
    </div>
</template>