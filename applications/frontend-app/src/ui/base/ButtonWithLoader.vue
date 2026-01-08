<script setup lang="ts">
    import { FwbButton, FwbSpinner } from 'flowbite-vue';

    const props = defineProps<{
        loading: boolean;
    }>();
</script>

<template>
  <fwb-button>
    <div  class="flex items-center justify-between gap-2">
        <slot></slot>
        <fwb-spinner v-if="loading" class="ml-2" />
    </div>
  </fwb-button>
</template>