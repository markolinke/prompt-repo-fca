<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Prompt } from '../entities/Prompt';
import { bootstrapPrompts } from '../bootstrap';
import PromptsList from '../components/PromptsList.vue';
import PromptDetails from '../components/PromptDetails.vue';
import { FwbModal } from 'flowbite-vue';

const bootstrap = bootstrapPrompts();
const promptsStore = bootstrap.useStore();

onMounted(() => {
  promptsStore.fetchPrompts();
});

const isModalOpen = ref(false);
const selectedPrompt = ref<Prompt | null>(null);

const handlePromptClick = (prompt: Prompt) => {
  selectedPrompt.value = prompt;
  isModalOpen.value = true;
};

const handleCloseModal = () => {
  isModalOpen.value = false;
  selectedPrompt.value = null;
};

const handleSave = async (updatedPrompt: Prompt) => {
  try {
    await promptsStore.updatePrompt(updatedPrompt);
    handleCloseModal();
  } catch (error) {
    // Error is already handled in the store and displayed in error state
    // Could add additional error handling here if needed
  }
};

const handleCancel = () => {
  handleCloseModal();
};
</script>

<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Prompts</h1>
    <PromptsList @prompt-click="handlePromptClick" />

    <!-- Flowbite Modal -->
    <FwbModal
      v-if="selectedPrompt"
      v-model="isModalOpen"
      size="4xl"
    >
      <template #header>
        <div class="flex items-center text-lg font-semibold text-gray-900">
          Edit Prompt
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <PromptDetails
            v-if="selectedPrompt"
            :prompt="Prompt.fromPlainObject({
              id: selectedPrompt.id,
              title: selectedPrompt.title,
              instructions: selectedPrompt.instructions,
              template: selectedPrompt.template,
              category: selectedPrompt.category,
              tags: [...selectedPrompt.tags]
            })"
            mode="edit"
            @save="handleSave"
            @cancel="handleCancel"
          />
        </div>
      </template>
    </FwbModal>
  </div>
</template>
