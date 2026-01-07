<script setup lang="ts">
import { ref, watch } from 'vue';
import { Note } from '../entities/Note';
import { FwbButton } from 'flowbite-vue';
import { bootstrapNotes } from '../bootstrap';

const bootstrap = bootstrapNotes();
const currentTimeProvider = bootstrap.getCurrentTimeProvider();

const props = defineProps<{
  note: Note;
}>();

const emit = defineEmits<{
  save: [note: Note];
  cancel: [];
  delete: [];
}>();

// Local state
const editTitle = ref<string>('');
const editContent = ref<string>('');
const editCategory = ref<string>('');
const editTags = ref<string[]>([]);
const newTag = ref<string>('');
const validationErrors = ref<string[]>([]);

// Initialize local state from note prop
const initializeEditState = () => {
  editTitle.value = props.note.title;
  editContent.value = props.note.content;
  editCategory.value = props.note.category ?? '';
  editTags.value = [...props.note.tags];
  newTag.value = '';
  validationErrors.value = [];
};

// Watch note prop to sync local state when it changes
watch(() => props.note, initializeEditState, { immediate: true });

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
  if (!editContent.value.trim()) {
    validationErrors.value.push('Content is required');
  }

  if (validationErrors.value.length > 0) {
    return;
  }

  try {
    // Construct new Note instance using fromPlainObject
    // Keep existing last_modified_utc for existing notes, use current date for new notes
    const lastModified = props.note.id ? props.note.last_modified_utc : currentTimeProvider.getCurrentTime();
    
    const updatedNote = Note.fromPlainObject({
      id: props.note.id,
      title: editTitle.value.trim(),
      content: editContent.value.trim(),
      last_modified_utc: lastModified,
      category: editCategory.value.trim() || null,
      tags: editTags.value.map(tag => tag.trim()).filter(tag => tag.length > 0),
    });

    emit('save', updatedNote);
  } catch (error) {
    if (error instanceof Error) {
      validationErrors.value.push(error.message);
    } else {
      validationErrors.value.push('Failed to create note');
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
          placeholder="Enter note title"
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

      <!-- Last Modified (Read-only) -->
      <div>
        <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Last Modified
        </label>
        <div class="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600">
          {{ note.last_modified_utc.toLocaleString() }}
        </div>
      </div>

      <!-- Content -->
      <div>
        <label for="edit-content" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
          Content <span class="text-red-500">*</span>
        </label>
        <textarea
          id="edit-content"
          v-model="editContent"
          rows="8"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-sans resize-y"
          placeholder="Enter note content"
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

