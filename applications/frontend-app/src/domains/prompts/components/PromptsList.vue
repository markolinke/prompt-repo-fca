<script setup lang="ts">
import { Prompt } from '../entities/Prompt';
import { bootstrapPrompts } from '../bootstrap';

const bootstrap = bootstrapPrompts();
const promptsStore = bootstrap.useStore();

const emit = defineEmits<{
  promptClick: [prompt: Prompt];
}>();

const handlePromptClick = (prompt: Prompt) => {
  emit('promptClick', prompt);
};

</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="promptsStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading prompts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="promptsStore.error" class="text-center py-8">
      <p class="text-red-600">Error: {{ promptsStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="promptsStore.prompts.length === 0" class="text-center py-8">
      <p class="text-gray-600">No prompts found.</p>
    </div>

    <!-- Prompts List -->
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="prompt in promptsStore.prompts"
        :key="prompt.id"
        class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
        @click="handlePromptClick(prompt as Prompt)"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h3 class="truncate text-base font-semibold text-gray-900">
            {{ prompt.title }}
          </h3>

          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span v-if="prompt.category" class="font-medium">
              {{ prompt.category }}
            </span>
            <span
              v-if="prompt.tags && prompt.tags.length > 0"
              class="flex flex-wrap gap-1"
            >
              <span
                v-for="tag in prompt.tags"
                :key="tag"
                class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
              >
                {{ tag }}
              </span>
            </span>
          </div>

          <p class="mt-1 line-clamp-1 text-xs text-gray-600">
            {{ prompt.instructions }}
          </p>
        </div>

        <!-- Right-side placeholder for future actions/meta -->
        <div class="hidden shrink-0 items-center gap-2 text-xs text-gray-400 sm:flex">
          <span class="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Active</span>
        </div>
      </li>
    </ul>
  </div>
</template>

