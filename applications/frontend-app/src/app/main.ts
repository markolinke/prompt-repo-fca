import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './main.css'
import { MyRouter } from './router/MyRouter'
import { bootstrapFeatures } from './bootstrap'

const app = createApp(App) // create the app

bootstrapFeatures(router); // loop through the features and add the routes to the router

app.use(router) // inject the router and the pinia store
app.use(pinia)

const myRouter = new MyRouter();  // router port for error handling and other routing related logic
app.provide('myRouter', myRouter)

app.mount('#app') // mount the app to the DOM
