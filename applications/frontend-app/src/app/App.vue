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
            Scaffolding App
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
          <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3" @click="isMenuOpen = false">
              <router-link :to="{ name: 'home' }">
                <div class="flex items-center gap-4">
                  <div class="rounded-full bg-slate-200 text-sm font-medium text-slate-700 h-10 w-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                  <div class="text-sm font-semibold text-slate-900">
                      Home
                  </div>
                </div>
              </router-link>
            </div>

            <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3" @click="isMenuOpen = false">
              <router-link :to="{ name: 'notes-list' }" @click="isMenuOpen = false">
                <div class="flex items-center gap-4">
                    <div class="rounded-full bg-slate-200 text-sm font-medium text-slate-700 h-10 w-10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </div>
                    <div class="text-sm font-semibold text-slate-900">
                        Notes
                    </div>
                  </div>
              </router-link>
            </div>

            <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3" @click="isMenuOpen = false">
              <router-link :to="{ name: 'login' }">
                <div class="flex items-center gap-4">
                    <div class="text-sm font-semibold text-red-500">
                        Logout
                    </div>
                  </div>
              </router-link>
            </div>
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
