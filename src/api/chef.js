import request from '@/utils/request'

export function getChefByUserId(userId) {
  return request({
    url: `/api/chefs/user/${userId}`,
    method: 'get'
  })
}

export function getChefDetail(chefId) {
  return request({
    url: `/api/chefs/${chefId}`,
    method: 'get'
  })
}

export function applyChef(data) {
  return request({
    url: '/api/chefs/apply',
    method: 'post',
    data
  })
}

export function updateChef(chefId, data) {
  return request({
    url: `/api/chefs/${chefId}`,
    method: 'put',
    data
  })
}

export function uploadChefImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/files/upload/chef-avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadChefCertImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/files/upload/chef-cert',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
