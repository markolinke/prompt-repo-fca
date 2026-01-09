import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './main.css'
import { bootstrapFeatures } from './bootstrap/bootstrapFeatures'
import { bootstrapDependencies } from './bootstrap/bootstrapDependencies'
import { createAuthGuard } from '@/domains/auth/utils/routeGuards'

const app = createApp(App) // create the app

// 1. Register dependencies FIRST (before router needs them)
bootstrapDependencies(router);

// 2. Add all routes BEFORE installing the router
const authBootstrap = bootstrapFeatures(router); // Add routes to router instance

// 3. NOW install the router and pinia (needed for route guard to access stores)
app.use(router) // inject the router and the pinia store
app.use(pinia)

// 4. Initialize auth state from storage (call after Pinia is installed)
if (authBootstrap) {
    authBootstrap.initializeAuth();
    
    // 5. Add route guards (must be after Pinia is installed so stores are available)
    router.beforeEach(
        createAuthGuard(
            () => authBootstrap.useStore(),
            'login'
        )
    );
}

// 6. Mount the app
app.mount('#app') // mount the app to the DOM
