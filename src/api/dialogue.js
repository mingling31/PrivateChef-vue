import request from '@/utils/request'

export function getDialogueHistory(userId, sessionId) {
  return request({
    url: '/api/dialogues/history',
    method: 'get',
    params: { userId, sessionId }
  })
}

export function chatDialogue(userId, data) {
  return request({
    url: '/api/dialogues/chat',
    method: 'post',
    params: { userId },
    data
  })
}

