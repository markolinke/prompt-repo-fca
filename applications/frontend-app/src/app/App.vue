<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div
    id="app"
    class="min-h-screen bg-slate-50 text-slate-900 flex flex-col"
  >
    <!-- Top navigation bar -->
    <header
      class="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm"
    >
      <div class="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
        <!-- Left: hamburger + title -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            aria-label="Open menu"
            @click="toggleMenu"
          >
            <span class="flex flex-col gap-1.5">
              <span class="block h-0.5 w-4 rounded bg-slate-700" />
              <span class="block h-0.5 w-4 rounded bg-slate-700" />
              <span class="block h-0.5 w-4 rounded bg-slate-700" />
            </span>
          </button>

          <h1 class="text-xl font-semibold tracking-tight text-lime-600">
            Prompts
          </h1>
        </div>
      </div>
    </header>

    <!-- Slide-down menu panel -->
    <transition name="fade">
      <div
        v-if="isMenuOpen"
        class="fixed inset-x-0 top-16 z-30"
      >
        <div class="mx-auto flex max-w-5xl px-4 sm:px-6">
          <div
            class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
          <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700"
            >
              DU
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">
                Demo User
              </p>
              <p class="text-xs text-slate-500">
                demo.user@example.com
              </p>
            </div>
          </div>

          <nav class="px-2 py-2 text-sm text-slate-700">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
              @click="isMenuOpen = false"
            >
              <span class="h-5 w-5 rounded-full border border-slate-300" />
              <span>Prompts</span>
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              <span class="h-5 w-5 rounded-full border border-slate-300" />
              <span>Guardians</span>
            </button>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              <span class="h-5 w-5 rounded-full border border-slate-300" />
              <span>Notifications</span>
            </button>

            <div class="mt-3 border-t border-slate-100 pt-2">
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-red-600 hover:bg-red-50"
              >
                <span class="h-5 w-5 rounded-full border border-red-300" />
                <span>Log out</span>
              </button>
            </div>
          </nav>
          </div>
        </div>
      </div>
    </transition>

    <!-- Page content -->
    <main class="flex-1">
      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>
