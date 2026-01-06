<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Prompt } from '../entities/Prompt';
import { bootstrapPrompts } from '../bootstrap';
import PromptsList from '../components/PromptsList.vue';
import PromptDetails from '../components/PromptDetails.vue';
import { FwbModal, FwbButton } from 'flowbite-vue';

const bootstrap = bootstrapPrompts();
const promptsStore = bootstrap.useStore();

const searchQuery = ref('');

onMounted(() => {
  promptsStore.fetchPrompts();
});

const isModalOpen = ref(false);
const selectedPrompt = ref<Prompt | null>(null);

// Clear selected prompt when modal closes (handles ESC and outside click)
watch(isModalOpen, (newValue) => {
  if (!newValue) {
    selectedPrompt.value = null;
  }
});

const handlePromptClick = (prompt: Prompt) => {
  selectedPrompt.value = prompt;
  isModalOpen.value = true;
};

const handleCloseModal = () => {
  isModalOpen.value = false;
  selectedPrompt.value = null;
};

const handleSave = async (prompt: Prompt) => {
  try {
    if (prompt.id) {
      await promptsStore.updatePrompt(prompt);
    } else {
      await promptsStore.createPrompt(prompt);
    }
    handleCloseModal();
  } catch (error) {
    // Error is already handled in the store and displayed in error state
    // Could add additional error handling here if needed
  }
};

const handleCancel = () => {
  handleCloseModal();
};

const handleDelete = () => {
  promptsStore.deletePrompt(selectedPrompt.value?.id ?? '');
  handleCloseModal();
};

const handleAddPrompt = () => {
  selectedPrompt.value = Prompt.fromPlainObject({
    id: '',
    title: '',
    instructions: '',
    template: '',
    category: '',
    tags: []
  });
  isModalOpen.value = true;
};

const handleSearch = () => {
  setTimeout(() => {
    promptsStore.searchPrompts(searchQuery.value);
  }, 500);
};
</script>

<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        Prompts
      </h1>
      <div class="flex items-center gap-2">
        <div>
          <input type="text" v-model="searchQuery" placeholder="Search prompts" class="border border-gray-300 placeholder-gray-400 rounded-md p-2" @input="handleSearch" />
        </div>

        <fwb-button color="blue" @click="handleAddPrompt">Add Prompt</fwb-button>
      </div>
    </div>
    <PromptsList @prompt-click="handlePromptClick" />

    <!-- Flowbite Modal -->
    <fwb-modal
      v-if="isModalOpen"
      @click:outside="handleCloseModal"
      @close="handleCloseModal"
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
            @save="handleSave"
            @cancel="handleCancel"
            @delete="handleDelete"
          />
        </div>
      </template>
    </fwb-modal>
  </div>
</template>
