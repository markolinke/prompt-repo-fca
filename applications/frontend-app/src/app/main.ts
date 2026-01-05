import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './main.css'
import { MyRouter } from './router/MyRouter'
import { bootstrapFeatures } from './bootstrap'
import { appDependencies } from '@/common/env/AppDependencies'

const app = createApp(App) // create the app

// 1. Register dependencies FIRST (before router needs them)
const myRouter = new MyRouter(router);
appDependencies.registerMyRouter(myRouter);
app.provide('myRouter', myRouter)

// 2. Add all routes BEFORE installing the router
bootstrapFeatures(router); // Add routes to router instance

// 3. NOW install the router (it will have all routes available)
app.use(router) // inject the router and the pinia store
app.use(pinia)

// 4. Mount the app
app.mount('#app') // mount the app to the DOM
