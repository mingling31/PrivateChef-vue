<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="brand">
        <p class="eyebrow">食光私厨</p>
        <h1>食光私厨上门服务平台</h1>
        <p>用户与私厨双主体认证，供需匹配更高效。</p>
      </div>

      <el-card class="card" shadow="never">
        <el-segmented v-model="loginMode" :options="loginModes" class="mode-switch" />

        <template v-if="!showRegister">
          <h2>{{ loginMode === 'chef' ? '私厨登录' : '用户登录' }}</h2>
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-position="top" autocomplete="on" @submit.prevent="handleLogin">
            <el-form-item :label="loginMode === 'chef' ? '私厨账号' : '用户名'" prop="username">
              <el-input v-model="loginForm.username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" show-password name="password" autocomplete="current-password" />
            </el-form-item>
            <el-button type="primary" class="full" :loading="loading" native-type="submit">登录</el-button>
          </el-form>
          <div class="switch-row" v-if="loginMode === 'user'">
            <span>还没有账号？</span>
            <el-link type="primary" @click="showRegister = true">立即注册</el-link>
          </div>
          <div class="switch-row" v-else>
            <span>还没有私厨账号？</span>
            <el-link type="primary" @click="$router.push('/register/chef')">私厨注册</el-link>
          </div>
        </template>

        <template v-else>
          <h2>用户注册</h2>
          <el-form ref="registerRef" :model="registerForm" :rules="registerRules" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" @blur="checkName" />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="registerForm.nickname" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="registerForm.phone" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" show-password />
            </el-form-item>
            <el-button type="primary" class="full" :loading="loading" @click="handleRegister">注册</el-button>
          </el-form>
          <div class="switch-row">
            <span>已有账号？</span>
            <el-link type="primary" @click="showRegister = false">返回登录</el-link>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { chefLogin, login, register } from '@/api/auth'
import { checkUsername } from '@/api/user'
import { EMAIL_REGEX, PHONE_REGEX } from '@/utils/validators'

const router = useRouter()
const route = useRoute()
const showRegister = ref(false)
const loading = ref(false)
const loginRef = ref()
const registerRef = ref()
const loginMode = ref('user')
const loginModes = [
  { label: '用户', value: 'user' },
  { label: '私厨', value: 'chef' }
]

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', nickname: '', phone: '', email: '', password: '' })

const loginRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的 11 位手机号', trigger: ['blur', 'change'] }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: EMAIL_REGEX, message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function toDefaultPage(roles) {
  if ((roles || []).includes('ROLE_ADMIN')) return '/admin'
  if ((roles || []).includes('ROLE_CHEF')) return '/chefCenter'
  return '/discover'
}

async function handleLogin() {
  await loginRef.value.validate()
  loading.value = true
  try {
    const api = loginMode.value === 'chef' ? chefLogin : login
    const res = await api(loginForm)
    const { id, account, roles, token, principalType } = res.data
    localStorage.setItem('jwtToken', token)
    localStorage.setItem('userInfo', JSON.stringify({ id, username: account, account, principalType }))
    localStorage.setItem('userRoles', JSON.stringify(roles || []))
    localStorage.setItem('principalType', principalType || (loginMode.value === 'chef' ? 'chef' : 'user'))

    const redirect = route.query.redirect ? decodeURIComponent(route.query.redirect) : ''
    router.push(redirect || toDefaultPage(roles))
    ElMessage.success(res.message || '登录成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  await registerRef.value.validate()
  loading.value = true
  try {
    await register({
      userName: registerForm.username,
      nickname: registerForm.nickname,
      phone: registerForm.phone,
      email: registerForm.email,
      password: registerForm.password
    })
    ElMessage.success('注册成功，请登录')
    showRegister.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}

async function checkName() {
  if (!registerForm.username) return
  const res = await checkUsername(registerForm.username)
  if (res.data) ElMessage.warning('用户名已存在')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #e6f3ff 0%, #f4f9ff 45%, #d9edff 100%);
  padding: 24px;
}

.login-panel {
  width: min(980px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  align-items: center;
}

.brand {
  padding: 32px;
}

.eyebrow {
  color: #1570c9;
  letter-spacing: 0.24em;
  font-size: 12px;
  margin-bottom: 14px;
}

.brand h1 {
  font-size: 46px;
  line-height: 1.1;
  color: #123d68;
  margin: 0 0 16px;
}

.brand p {
  color: #3f5f7c;
  font-size: 18px;
  line-height: 1.7;
}

.card {
  border-radius: 20px;
  border: 1px solid #cde4fb;
  background: rgba(255, 255, 255, 0.95);
}

.mode-switch {
  margin-bottom: 12px;
}

.card h2 {
  margin: 0 0 18px;
  color: #123d68;
}

.full {
  width: 100%;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  color: #42607a;
}

@media (max-width: 900px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .brand {
    padding: 8px 0;
  }

  .brand h1 {
    font-size: 34px;
  }
}
</style>
