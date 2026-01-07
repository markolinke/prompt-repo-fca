<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Note } from '../entities/Note';
import { bootstrapNotes } from '../bootstrap';
import NotesList from '../components/NotesList.vue';
import NoteDetails from '../components/NoteDetails.vue';
import { FwbModal, FwbButton } from 'flowbite-vue';

const bootstrap = bootstrapNotes();
const notesStore = bootstrap.useStore();
const searchDebouncer = bootstrap.createSearchDebouncer();

const searchQuery = ref('');

onMounted(() => {
  notesStore.fetchNotes();
});

const isModalOpen = ref(false);
const selectedNote = ref<Note | null>(null);

// Clear selected note when modal closes (handles ESC and outside click)
watch(isModalOpen, (newValue) => {
  if (!newValue) {
    selectedNote.value = null;
  }
});

const handleNoteClick = (note: Note) => {
  selectedNote.value = note;
  isModalOpen.value = true;
};

const handleCloseModal = () => {
  isModalOpen.value = false;
  selectedNote.value = null;
};

const handleSave = async (note: Note) => {
  try {
    if (note.id) {
      await notesStore.updateNote(note);
    } else {
      await notesStore.createNote(note);
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
  notesStore.deleteNote(selectedNote.value?.id ?? '');
  handleCloseModal();
};

const handleAddNote = () => {
  selectedNote.value = Note.fromPlainObject({
    id: '',
    title: '',
    content: '',
    last_modified_utc: bootstrap.getCurrentTimeProvider().getCurrentTime(),
    category: '',
    tags: []
  });
  isModalOpen.value = true;
};

const handleSearch = () => {
  searchDebouncer(() => {
    notesStore.searchNotes(searchQuery.value);
  });
};
</script>

<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        Notes
      </h1>
      <div class="flex items-center gap-2">
        <div>
          <input type="text" 
          v-model="searchQuery" 
          data-testid="search-input"
          placeholder="Search notes" 
          class="border border-gray-300 placeholder-gray-400 rounded-md p-2" 
          @input="handleSearch" 
          />
        </div>

        <fwb-button color="blue" @click="handleAddNote" data-testid="add-note-button">Add Note</fwb-button>
      </div>
    </div>
    <NotesList @note-click="handleNoteClick" />

    <!-- Flowbite Modal -->
    <fwb-modal
      v-if="isModalOpen"
      @click:outside="handleCloseModal"
      @close="handleCloseModal"
      data-testid="note-details-modal"
    >
      <template #header>
        <div class="flex items-center text-lg font-semibold text-gray-900">
          Edit Note
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <NoteDetails
            v-if="selectedNote"
            :note="Note.fromPlainObject({
              id: selectedNote.id,
              title: selectedNote.title,
              content: selectedNote.content,
              last_modified_utc: selectedNote.last_modified_utc,
              category: selectedNote.category,
              tags: [...selectedNote.tags]
            })"
            @save="handleSave"
            @cancel="handleCancel"
            @delete="handleDelete"
            data-testid="note-details-component"
          />
        </div>
      </template>
    </fwb-modal>
  </div>
</template>
