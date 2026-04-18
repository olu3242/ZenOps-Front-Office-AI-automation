import { describe, it, expect } from 'vitest'
import { toCSV } from '@/lib/csv'

describe('toCSV', () => {
  it('returns empty string for empty array', () => {
    expect(toCSV([])).toBe('')
  })

  it('generates header + data row', () => {
    const result = toCSV([{ name: 'Acme', status: 'new' }])
    expect(result).toBe('name,status\nAcme,new')
  })

  it('escapes commas in values', () => {
    const result = toCSV([{ name: 'Acme, Inc', status: 'new' }])
    expect(result).toContain('"Acme, Inc"')
  })

  it('escapes double quotes', () => {
    const result = toCSV([{ name: 'Say "hello"', status: 'new' }])
    expect(result).toContain('"Say ""hello"""')
  })

  it('handles null values as empty string', () => {
    const result = toCSV([{ name: null, status: 'new' }])
    expect(result).toBe('name,status\n,new')
  })
})
