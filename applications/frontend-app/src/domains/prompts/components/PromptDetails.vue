<script setup lang="ts">
import { ref, watch } from 'vue';
import { Prompt } from '../entities/Prompt';
import { FwbButton } from 'flowbite-vue';

const props = defineProps<{
  prompt: Prompt;
}>();

const emit = defineEmits<{
  save: [prompt: Prompt];
  cancel: [];
  delete: [];
}>();

// Local state
const editTitle = ref<string>('');
const editInstructions = ref<string>('');
const editTemplate = ref<string>('');
const editCategory = ref<string>('');
const editTags = ref<string[]>([]);
const newTag = ref<string>('');
const validationErrors = ref<string[]>([]);

// Initialize local state from prompt prop
const initializeEditState = () => {
  editTitle.value = props.prompt.title;
  editInstructions.value = props.prompt.instructions;
  editTemplate.value = props.prompt.template;
  editCategory.value = props.prompt.category ?? '';
  editTags.value = [...props.prompt.tags];
  newTag.value = '';
  validationErrors.value = [];
};

// Watch prompt prop to sync local state when it changes
watch(() => props.prompt, initializeEditState, { immediate: true });

const addTag = () => {
  const tag = newTag.value.trim();
  if (tag && !editTags.value.includes(tag)) {
    editTags.value.push(tag);
    newTag.value = '';
  }
};

const removeTag = (tagToRemove: string) => {
  editTags.value = editTags.value.filter(tag => tag !== tagToRemove);
};

const handleSave = () => {
  validationErrors.value = [];

  // Basic validation
  if (!editTitle.value.trim()) {
    validationErrors.value.push('Title is required');
  }
  if (!editInstructions.value.trim()) {
    validationErrors.value.push('Instructions are required');
  }
  if (!editTemplate.value.trim()) {
    validationErrors.value.push('Template is required');
  }

  if (validationErrors.value.length > 0) {
    return;
  }

  try {
    // Construct new Prompt instance using fromPlainObject
    const updatedPrompt = Prompt.fromPlainObject({
      id: props.prompt.id,
      title: editTitle.value.trim(),
      instructions: editInstructions.value.trim(),
      template: editTemplate.value.trim(),
      category: editCategory.value.trim() || null,
      tags: editTags.value.map(tag => tag.trim()).filter(tag => tag.length > 0),
    });

    emit('save', updatedPrompt);
  } catch (error) {
    if (error instanceof Error) {
      validationErrors.value.push(error.message);
    } else {
      validationErrors.value.push('Failed to create prompt');
    }
  }
};

const handleCancel = () => {
  initializeEditState();
  emit('cancel');
};

const handleDelete = () => {
  emit('delete');
};

const handleTagInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTag();
  }
};
</script>

<template>
  <div>
    <div class="space-y-6">
      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="rounded-lg border border-red-200 bg-red-50 p-4">
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(error, index) in validationErrors" :key="index" class="text-sm text-red-700">
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Title -->
      <div>
        <label for="edit-title" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          id="edit-title"
          v-model="editTitle"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="Enter prompt title"
        />
      </div>

      <!-- Category -->
      <div>
        <label for="edit-category" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Category
        </label>
        <input
          id="edit-category"
          v-model="editCategory"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="e.g., design/features/validation"
        />
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
          Tags
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="tag in editTags"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
          >
            {{ tag }}
            <button
              type="button"
              @click="removeTag(tag)"
              class="ml-1 text-blue-700 hover:text-blue-900 focus:outline-none"
              aria-label="Remove tag"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newTag"
            type="text"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Add a tag"
            @keydown="handleTagInputKeydown"
          />
          <fwb-button
            @click="addTag"
            color="blue"
            size="sm"
          >
            Add
          </fwb-button>
        </div>
      </div>

      <!-- Instructions -->
      <div>
        <label for="edit-instructions" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Instructions <span class="text-red-500">*</span>
        </label>
        <textarea
          id="edit-instructions"
          v-model="editInstructions"
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-sans resize-y"
          placeholder="Enter instructions for the prompt"
        />
      </div>

      <!-- Template -->
      <div>
        <label for="edit-template" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Template <span class="text-red-500">*</span>
        </label>
        <textarea
          id="edit-template"
          v-model="editTemplate"
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-y"
          placeholder="Enter the prompt template"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between">
        <div>
            <fwb-button color="red" @click="handleDelete">Delete</fwb-button>
        </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <fwb-button
              @click="handleCancel"
              color="light"
            >
              Cancel
            </fwb-button>
            <fwb-button
              @click="handleSave"
              color="blue"
            >
              Save
            </fwb-button>
          </div>
      </div>
    </div>
  </div>
</template>

