<script setup lang="ts">

const api_base_url = import.meta.env.VITE_API_BASE_URL;

</script>

<template>
  <h1>Home Page</h1>

  <div>
    <code>
      API Base URL: {{ api_base_url }}
    </code>
  </div>

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
