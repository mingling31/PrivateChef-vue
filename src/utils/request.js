import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import router from '@/router'

// 创建axios实例
const request = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || '/',
    timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        // 在发送请求之前做些什么
        const token = getToken()
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token
        }
        return config
    },
    error => {
        // 对请求错误做些什么
        console.log('请求错误:', error)
        return Promise.reject(error)
    }
)
// 响应拦截器
request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        const { status, data } = error.response || {}

        if (status === 401) {
            // 认证失败 - token 无效或过期
            console.log('认证失败，跳转到登录页')
            localStorage.removeItem('jwtToken')
            localStorage.removeItem('userInfo')
            localStorage.removeItem('userRoles')
            const redirect = encodeURIComponent(router.currentRoute.value?.fullPath || '/discover')
            router.push(`/login?redirect=${redirect}`)
        } else if (status === 403) {
            // 权限不足 - 有token但权限不够
            ElMessage.error('权限不足，无法访问该资源')
            // 不清除token，只是提示
        } else {
            // 其他错误
            ElMessage.error(error.message || '请求失败')
        }

        return Promise.reject(error)
    }
)

export default request
