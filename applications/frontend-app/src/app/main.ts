import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './main.css'
import { bootstrapFeatures } from './bootstrap/bootstrapFeatures'
import { bootstrapDependencies } from './bootstrap/bootstrapDependencies'

const app = createApp(App) // create the app

// 1. Register dependencies FIRST (before router needs them)
bootstrapDependencies(router);

// 2. Add all routes BEFORE installing the router
const authBootstrap = bootstrapFeatures(router); // Add routes to router instance

// 2.5. Add route guards (non-enforcing in Phase 2 - structure only)
if (authBootstrap) {
    router.beforeEach((_to, _from, next) => {
        // const authStore = authBootstrap.useStore();
        
        // Phase 2: Structure only - don't enforce yet
        // Phase 3: Check auth state and redirect to login if needed
        // if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        //   next({ name: 'login' });
        // } else {
        //   next();
        // }
        
        next();
    });
}

// 3. NOW install the router (it will have all routes available)
app.use(router) // inject the router and the pinia store
app.use(pinia)

// 4. Mount the app
app.mount('#app') // mount the app to the DOM
