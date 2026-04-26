import request from '@/utils/request'

export function getChefPackages(chefId, mealType) {
  return request({
    url: '/api/packages',
    method: 'get',
    params: { chefId, mealType }
  })
}

export function saveChefPackage(data) {
  return request({
    url: '/api/packages',
    method: 'post',
    data
  })
}

export function updateChefPackage(packageId, data) {
  return request({
    url: `/api/packages/${packageId}`,
    method: 'put',
    data
  })
}

export function deleteChefPackage(packageId) {
  return request({
    url: `/api/packages/${packageId}`,
    method: 'delete'
  })
}

export function uploadPackageImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/files/upload/package',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
