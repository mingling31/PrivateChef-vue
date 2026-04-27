<template>
  <el-card>
    <template #header>我的偏好</template>
    <el-form :model="form" label-width="120px" class="preference-form">
      <el-form-item label="偏好菜系">
        <el-checkbox-group v-model="form.preferredCuisines">
          <el-checkbox v-for="tag in cuisineTags" :key="tag.tagId" :value="tag.tagId">
            {{ tag.tagName }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="预算区间">
        <div class="inline-fields">
          <el-input v-model="budgetMinText" placeholder="最低预算（元）" />
          <span class="sep">-</span>
          <el-input v-model="budgetMaxText" placeholder="最高预算（元）" />
        </div>
      </el-form-item>

      <el-form-item label="常用人数">
        <el-select v-model="personsText" placeholder="请选择">
          <el-option v-for="item in personOptions" :key="item" :label="`${item}人`" :value="String(item)" />
        </el-select>
      </el-form-item>

      <el-form-item label="常用时段">
        <el-checkbox-group v-model="form.usualMealTypes">
          <el-checkbox value="1">早餐</el-checkbox>
          <el-checkbox value="2">午餐</el-checkbox>
          <el-checkbox value="3">晚餐</el-checkbox>
          <el-checkbox value="4">宵夜</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="食材方式">
        <el-radio-group v-model="form.usualIngredientOption">
          <el-radio :value="1">自备食材</el-radio>
          <el-radio :value="2">私厨代买</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="忌口信息">
        <el-input v-model="form.dietaryRestrictions" type="textarea" :rows="3" placeholder="例如：不吃香菜、海鲜过敏" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存偏好</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPreferenceProfile, savePreferenceProfile } from '@/api/preference'
import { getCuisineTags } from '@/api/public'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const saving = ref(false)
const cuisineTags = ref([])
const budgetMinText = ref('')
const budgetMaxText = ref('')
const personsText = ref('')
const personOptions = [1, 2, 3, 4, 5, 6, 8, 10]

const form = reactive({
  preferredCuisines: [],
  budgetMin: null,
  budgetMax: null,
  dietaryRestrictions: '',
  usualPersons: null,
  usualMealTypes: [],
  usualIngredientOption: 1
})

function parseNumberOrNull(value, fieldName) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  if (!/^\d+$/.test(String(value).trim())) {
    throw new Error(`${fieldName}请输入数字`)
  }
  return Number(value)
}

async function load() {
  const [prefRes, tagRes] = await Promise.all([
    getPreferenceProfile(userInfo.id),
    getCuisineTags()
  ])
  cuisineTags.value = tagRes.data || []
  const data = prefRes.data || {}
  form.preferredCuisines = data.preferredCuisines || []
  form.budgetMin = data.budgetMin ?? null
  form.budgetMax = data.budgetMax ?? null
  form.dietaryRestrictions = data.dietaryRestrictions || ''
  form.usualPersons = data.usualPersons ?? null
  form.usualMealTypes = data.usualMealTypes || []
  form.usualIngredientOption = data.usualIngredientOption || 1

  budgetMinText.value = form.budgetMin == null ? '' : String(form.budgetMin)
  budgetMaxText.value = form.budgetMax == null ? '' : String(form.budgetMax)
  personsText.value = form.usualPersons == null ? '' : String(form.usualPersons)
}

async function save() {
  try {
    form.budgetMin = parseNumberOrNull(budgetMinText.value, '最低预算')
    form.budgetMax = parseNumberOrNull(budgetMaxText.value, '最高预算')
    form.usualPersons = parseNumberOrNull(personsText.value, '常用人数')

    if (form.budgetMin != null && form.budgetMax != null && form.budgetMin > form.budgetMax) {
      ElMessage.warning('预算最低值不能大于最高值')
      return
    }

    saving.value = true
    await savePreferenceProfile(userInfo.id, form)
    ElMessage.success('偏好已更新')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.preference-form {
  max-width: 860px;
}

.inline-fields {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 520px;
}

.sep {
  color: #6b7f95;
}
</style>
