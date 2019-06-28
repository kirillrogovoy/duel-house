export function isNode() {
  return !!global && !!global.process
}

export function failIfNode() {
  if (isNode()) {
    throw new Error('this code is not supposed to run in Node')
  }
}
