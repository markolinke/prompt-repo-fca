<script setup lang="ts">
import { usePromptsStore } from '../store/PromptsStore';
import { storeToRefs } from 'pinia';

const promptsStore = usePromptsStore();
const { prompts, loading, error } = storeToRefs(promptsStore);
</script>

<template>
  <div class="prompts-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Loading prompts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">Error: {{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="prompts.length === 0" class="text-center py-8">
      <p class="text-gray-600">No prompts found.</p>
    </div>

    <!-- Prompts List -->
    <ul v-else class="space-y-4">
      <li
        v-for="prompt in prompts"
        :key="prompt.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold text-gray-900">{{ prompt.title }}</h3>
          
          <div v-if="prompt.category" class="text-sm text-gray-600">
            <span class="font-medium">Category:</span> {{ prompt.category }}
          </div>
          
          <div v-if="prompt.tags && prompt.tags.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="tag in prompt.tags"
              :key="tag"
              class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {{ tag }}
            </span>
          </div>
          
          <p class="text-sm text-gray-700 mt-2 line-clamp-2">{{ prompt.instructions }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.prompts-list {
  width: 100%;
}
</style>

