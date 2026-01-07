<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const api_base_url = import.meta.env.VITE_API_BASE_URL;

</script>

<template>
  <h1>Hello World</h1>

  <div>
    <code>
      API Base URL: {{ api_base_url }}
    </code>
  </div>

  <button type="button" @click="count++">count is {{ count }}</button>
  <div class="mt-4">
    <RouterLink to="/notes">Notes</RouterLink>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
