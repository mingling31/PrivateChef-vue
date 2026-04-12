<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="header">
          <span>私厨独立注册</span>
          <el-button link @click="$router.push('/login')">返回登录</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="私厨账号" prop="chefAccount">
          <el-input v-model="form.chefAccount" />
        </el-form-item>
        <el-form-item label="登录密码" prop="chefPassword">
          <el-input v-model="form.chefPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" />
        </el-form-item>
        <el-form-item label="从业年限" prop="yearsExp">
          <el-input-number v-model="form.yearsExp" :min="0" />
        </el-form-item>
        <el-form-item label="健康证图片">
          <el-input v-model="form.healthCert" placeholder="请输入健康证图片地址" />
        </el-form-item>
        <el-form-item label="厨师头像">
          <el-input v-model="form.avatar" placeholder="请输入私厨头像地址" />
        </el-form-item>
        <el-form-item label="擅长菜系" prop="cuisineTypeList">
          <el-select v-model="form.cuisineTypeList" multiple placeholder="至少选择一个">
            <el-option v-for="tag in cuisineTags" :key="tag.tagId" :label="tag.tagName" :value="tag.tagId" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">提交审核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { chefRegister } from '@/api/auth'
import { getCuisineTags } from '@/api/public'
import { isValidIdCard, PHONE_REGEX } from '@/utils/validators'

const router = useRouter()
const loading = ref(false)
const formRef = ref()
const cuisineTags = ref([])

const form = reactive({
  chefAccount: '',
  chefPassword: '',
  phone: '',
  realName: '',
  idCard: '',
  yearsExp: 1,
  healthCert: '',
  avatar: '',
  cuisineTypeList: []
})

const rules = {
  chefAccount: [{ required: true, message: '请输入私厨账号', trigger: 'blur' }],
  chefPassword: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: PHONE_REGEX, message: '请输入正确的 11 位手机号', trigger: ['blur', 'change'] }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!value || isValidIdCard(value)) return callback()
        callback(new Error('请输入正确的 18 位身份证号'))
      },
      trigger: ['blur', 'change']
    }
  ],
  yearsExp: [{ required: true, message: '请输入从业年限', trigger: 'change' }],
  cuisineTypeList: [{ type: 'array', required: true, message: '请至少选择一个菜系', trigger: 'change' }]
}

async function loadCuisineTags() {
  const res = await getCuisineTags()
  cuisineTags.value = res.data || []
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await chefRegister({
      chefAccount: form.chefAccount,
      chefPassword: form.chefPassword,
      phone: form.phone,
      realName: form.realName,
      idCard: form.idCard,
      yearsExp: form.yearsExp,
      healthCert: form.healthCert,
      avatar: form.avatar,
      cuisineTypes: JSON.stringify(form.cuisineTypeList)
    })
    ElMessage.success('注册申请已提交，请等待管理员审核')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadCuisineTags)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(120deg, #e6f3ff, #f7fbff);
}

.card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
