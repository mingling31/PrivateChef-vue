import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server:{
    host:"localhost",
    port:5001,
    open:true,
    proxy:{
      "/api":{
        target:"http://localhost:8082",
        changeOrigin:true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      "/images": {
        target: "http://localhost:8082",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "src")
      }
    ]
  }
})
