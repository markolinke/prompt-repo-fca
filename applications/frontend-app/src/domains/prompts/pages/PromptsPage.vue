<script setup lang="ts">
import { onMounted } from 'vue';
import { usePromptsStore } from '../store/PromptsStore';
import PromptsList from '../components/PromptsList.vue';

const promptsStore = usePromptsStore();

onMounted(() => {
  promptsStore.fetchPrompts();
});
</script>

<template>
  <div class="prompts-page container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Prompts</h1>
    <PromptsList />
  </div>
</template>

<style scoped>
.prompts-page {
  max-width: 1200px;
}
</style>

