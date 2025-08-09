import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with async code', async () => {
    const promise = Promise.resolve(42)
    await expect(promise).resolves.toBe(42)
  })

  it('should test arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should test objects', () => {
    const obj = { name: 'Test', value: 123 }
    expect(obj).toMatchObject({ name: 'Test' })
    expect(obj.value).toBeGreaterThan(100)
  })
})