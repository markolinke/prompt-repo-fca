<script setup lang="ts">
import { Note } from '../entities/Note';
import { bootstrapNotes } from '../bootstrap';

const bootstrap = bootstrapNotes();
const notesStore = bootstrap.useStore();

const emit = defineEmits<{
  noteClick: [note: Note];
}>();

const handleNoteClick = (note: Note) => {
  emit('noteClick', note);
};

</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="notesStore.loading" class="text-center py-8">
      <p class="text-gray-600">Loading notes...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="notesStore.error" class="text-center py-8">
      <p class="text-red-600">Error: {{ notesStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notesStore.notes.length === 0" class="text-center py-8">
      <p class="text-gray-600">No notes found.</p>
    </div>

    <!-- Notes List -->
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="note in notesStore.notes"
        :key="note.id"
        data-testid="note-item"
        class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
        @click="handleNoteClick(note as Note)"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h3 class="truncate text-base font-semibold text-gray-900">
            {{ note.title }}
          </h3>

          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span v-if="note.category" class="font-medium">
              {{ note.category }}
            </span>
            <span
              v-if="note.tags && note.tags.length > 0"
              class="flex flex-wrap gap-1"
            >
              <span
                v-for="tag in note.tags"
                :key="tag"
                class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
              >
                {{ tag }}
              </span>
            </span>
          </div>

          <p class="mt-1 line-clamp-1 text-xs text-gray-600">
            {{ note.content }}
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

