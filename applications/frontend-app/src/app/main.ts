import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './main.css'
import { MyRouter } from './router/MyRouter'
const app = createApp(App)

app.use(router)
app.use(pinia)

const myRouter = new MyRouter();
app.provide('myRouter', myRouter)

app.mount('#app')
