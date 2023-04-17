import { createApp } from 'vue';

import Prism from 'prismjs';
import App from './App.vue';
import router from './router';
import store from './store';

import '@/assets/main.css';

createApp(App).use(router).use(store).mount('#app');
