<template>
  <div class="login-page max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6">Login</h1>
    
    <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ authStore.error }}
    </div>
    
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          data-testid="email-input"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.loading"
        />
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          data-testid="password-input"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.loading"
        />
      </div>
      
      <button
        type="submit"
        data-testid="login-button"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="authStore.loading"
      >
        <span v-if="authStore.loading">Logging in...</span>
        <span v-else>Login</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { bootstrapAuth } from '@/domains/auth';
import { appDependencies } from '@/common/env/AppDependencies';

const bootstrap = bootstrapAuth();
const authStore = bootstrap.useStore();
const myRouter = appDependencies.getMyRouter();
const route = useRoute();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
    try {
        await authStore.login(email.value, password.value);
        
        // Get redirect query parameter or default to 'home'
        const redirect = (route.query.redirect as string) || 'home';
        
        // Navigate to intended route or home after successful login
        // If redirect is a path, use it; otherwise treat as route name
        if (redirect.startsWith('/')) {
            myRouter.navigateTo({ path: redirect });
        } else {
            myRouter.navigateTo({ name: redirect });
        }
    } catch (error) {
        // Error is already set in store, just log for debugging
        console.error('Login failed:', error);
    }
};
</script>

