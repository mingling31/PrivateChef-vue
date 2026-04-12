import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { zhCn } from 'element-plus/es/locale/index'
import BaiduMap from 'vue-baidu-map-3x'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(BaiduMap, {
  ak: import.meta.env.VITE_BAIDU_MAP_AK || 'ysmkamDJKqOcBvMHnVBlRr3Br33KfU3P'
})

app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
