<script setup lang="ts">

const api_base_url = import.meta.env.VITE_API_BASE_URL;

</script>

<template>

  <div class="mt-4 max-w-4xl mx-auto">
    <div class="bg-blue-50 p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to the Frontend Architecture Scaffold</h2>
      
      <p class="text-gray-700 mb-4 leading-relaxed">
        This application serves as a <strong>scaffolding template</strong> and <strong>reference implementation</strong> 
        for building frontend applications using <strong>Flat Clean Architecture</strong> principles. The 
        <strong>Notes domain</strong> demonstrates a complete, production-ready feature implementation that you can 
        use as a blueprint for your own features.
      </p>

      <div class="bg-white p-5 rounded-lg shadow-sm mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Core Principles</h3>
        <ul class="space-y-2 text-gray-700">
          <li class="flex items-start">
            <span class="text-blue-500 mr-2">✓</span>
            <span><strong>Clean Architecture:</strong> Clear separation of concerns with domain, data, application, and presentation layers</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-500 mr-2">✓</span>
            <span><strong>SOLID Principles:</strong> Single responsibility, dependency inversion, and interface segregation throughout</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-500 mr-2">✓</span>
            <span><strong>Testability:</strong> 100% test coverage target with comprehensive unit and integration tests</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-500 mr-2">✓</span>
            <span><strong>Code Clarity:</strong> Self-documenting code optimized for junior developers and AI agents</span>
          </li>
        </ul>
      </div>

      <div class="bg-white p-5 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
        <p class="text-gray-700 mb-3">
          Explore the <strong>Notes domain</strong> (<code class="bg-gray-100 px-2 py-1 rounded text-sm">src/domains/notes/</code>) 
          to see a complete feature implementation including:
        </p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 mb-3">
          <li>Entities with validation</li>
          <li>Repository pattern with ports (HTTP and Mock implementations)</li>
          <li>Service layer for business logic</li>
          <li>Pinia store with dependency injection</li>
          <li>Vue components following best practices</li>
          <li>Comprehensive test coverage</li>
        </ul>
        <p class="text-gray-700">
          For detailed documentation, see <code class="bg-gray-100 px-2 py-1 rounded text-sm">docs/</code> directory, 
          starting with <code class="bg-gray-100 px-2 py-1 rounded text-sm">architecture.md</code>.
        </p>
      </div>
    </div>
  </div>

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
