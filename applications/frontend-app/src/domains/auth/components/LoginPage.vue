<template>
  <div class="login-page">
    <h1>Login</h1>
    <fwb-button @click="handleLogin">Login with Google (Mock)</fwb-button>
    <!-- Phase 3: Real OAuth button -->
  </div>
</template>

<script setup lang="ts">
import { appDependencies } from '@/common/env/AppDependencies';
import { bootstrapAuth } from '@/domains/auth';
import { FwbButton } from 'flowbite-vue';

const bootstrap = bootstrapAuth();
const authStore = bootstrap.useStore();
const myRouter = appDependencies.getMyRouter();
const handleLogin = async () => {
    // Phase 2: Just fetch mock user
    authStore.fetchCurrentUser()
    .then(() => {
      alert(`Welcome ${authStore.user?.name}`);
      myRouter.navigateTo({ name: 'home' });
    });
};
</script>

