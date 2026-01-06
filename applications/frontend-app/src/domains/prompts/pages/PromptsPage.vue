<script setup lang="ts">
import { onMounted } from 'vue';
import { bootstrapPrompts } from '../bootstrap';
import PromptsList from '../components/PromptsList.vue';

const bootstrap = bootstrapPrompts();
const promptsStore = bootstrap.useStore();

onMounted(() => {
  promptsStore.fetchPrompts();
});
</script>

<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Prompts</h1>
    <PromptsList />
  </div>
</template>
