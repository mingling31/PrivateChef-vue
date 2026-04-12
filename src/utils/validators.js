export const PHONE_REGEX = /^1[3-9]\d{9}$/
export const EMAIL_REGEX = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/

const ID_CARD_REGEX = /^\d{17}[\dXx]$/
const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

export function isValidPhone(phone) {
  return PHONE_REGEX.test((phone || '').trim())
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test((email || '').trim())
}

export function isValidIdCard(idCard) {
  const value = (idCard || '').trim()
  if (!ID_CARD_REGEX.test(value)) return false
  const chars = value.toUpperCase().split('')
  const sum = ID_WEIGHTS.reduce((total, weight, idx) => total + Number(chars[idx]) * weight, 0)
  const checkCode = ID_CODES[sum % 11]
  return checkCode === chars[17]
}
