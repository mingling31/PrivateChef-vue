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
