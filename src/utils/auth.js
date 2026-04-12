import router from '@/router'
import { ElMessage } from 'element-plus'
import axios from './request'

export function logout() {
    // 可选：调用后端登出接口
    // axios.post('/logout').catch(() => {})

    // 清空本地存储
    localStorage.removeItem('jwtToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRoles')

    // 清空 axios 全局 token
    axios.defaults.headers.common['Authorization'] = ''

    // 路由跳转并刷新
    router.replace('/login')
    ElMessage.success('退出登录成功')
}

// 获取token
export function getToken() {
    return localStorage.getItem('jwtToken')
}

// 设置token
export function setToken(token) {
    localStorage.setItem('jwtToken', token);
    // 同时设置 axios 默认请求头
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    return token;
}

// 移除token
export function removeToken() {
    return localStorage.removeItem('jwtToken')
}

// 获取用户信息
export function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo')
    return userInfo ? JSON.parse(userInfo) : null
}

// 获取用户角色
export function getUserRoles() {
    const roles = localStorage.getItem('userRoles')
    return roles ? JSON.parse(roles) : []
}

// 检查是否登录
export function isLoggedIn() {
    return !!getToken()
}

// 检查是否有某个角色
export function hasRole(role) {
    const roles = getUserRoles()
    return roles.includes(role)
}