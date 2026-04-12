import request from '@/utils/request'

export function getChefDishes(chefId, dishCategory) {
  return request({
    url: '/api/dishes',
    method: 'get',
    params: { chefId, dishCategory }
  })
}

export function saveDish(data) {
  return request({
    url: '/api/dishes',
    method: 'post',
    data
  })
}

export function updateDish(dishId, data) {
  return request({
    url: `/api/dishes/${dishId}`,
    method: 'put',
    data
  })
}

export function deleteDish(dishId) {
  return request({
    url: `/api/dishes/${dishId}`,
    method: 'delete'
  })
}

export function uploadDishImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/files/upload/dish',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
