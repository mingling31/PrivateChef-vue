import request from '@/utils/request'

export function checkUsername(username) {
  return request({
    url: '/api/users/check-username',
    method: 'get',
    params: { username }
  })
}

export function getUserById(userId) {
  return request({
    url: `/api/users/${userId}`,
    method: 'get'
  })
}

export function updateUser(data) {
  return request({
    url: '/api/users/update-info',
    method: 'put',
    data
  })
}

export function getUsers(params) {
  return request({
    url: '/api/users/list',
    method: 'get',
    params
  })
}

export function getUserAddresses(userId) {
  return request({
    url: `/api/users/${userId}/addresses`,
    method: 'get'
  })
}

export function saveUserAddress(userId, data) {
  return request({
    url: `/api/users/${userId}/addresses`,
    method: 'post',
    data
  })
}

export function updateUserAddress(userId, addressId, data) {
  return request({
    url: `/api/users/${userId}/addresses/${addressId}`,
    method: 'put',
    data
  })
}

export function deleteUserAddress(userId, addressId) {
  return request({
    url: `/api/users/${userId}/addresses/${addressId}`,
    method: 'delete'
  })
}

export function reviewUser(data) {
  return request({
    url: '/api/users/review',
    method: 'post',
    data
  })
}

export function updateUserStatus(userId, payload = {}) {
  const rawStatus = payload.status
  let status = rawStatus
  if (rawStatus === 'active') status = '1'
  if (rawStatus === 'disabled') status = '0'
  return request({
    url: '/api/users/review',
    method: 'post',
    data: {
      userId,
      status
    }
  })
}

export function uploadUserAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/users/upload-avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
