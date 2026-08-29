import { describe, it, expect } from 'vitest'
import { parseCSVText, parsePastedText } from '@/utils/fileParser'

describe('parseCSVText', () => {
  it('parses quoted field containing comma', () => {
    const csv = 'name,value\n"a","b,c"\n"hello","world, test"'
    const rows = parseCSVText(csv)
    expect(rows).toEqual([
      { name: 'a', value: 'b,c' },
      { name: 'hello', value: 'world, test' },
    ])
  })

  it('parses quoted field containing newline', () => {
    const csv = 'name,note\n"a","line1\nline2"\n"b","single"'
    const rows = parseCSVText(csv)
    expect(rows[0].name).toBe('a')
    expect(rows[0].note).toBe('line1\nline2')
    expect(rows[1].note).toBe('single')
  })

  it('parses quoted field containing escaped quotes', () => {
    const csv = 'name,value\n"a","he said ""hi"""'
    const rows = parseCSVText(csv)
    expect(rows[0].value).toBe('he said "hi"')
  })

  it('trims header whitespace', () => {
    const csv = ' name , value \n1,2'
    const rows = parseCSVText(csv)
    expect(rows[0]).toHaveProperty('name')
    expect(rows[0]).toHaveProperty('value')
    expect(rows[0].name).toBe(1)
  })

  it('skips empty lines and trailing newline', () => {
    const csv = 'a,b\n1,2\n\n3,4\n'
    const rows = parseCSVText(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ a: 1, b: 2 })
    expect(rows[1]).toEqual({ a: 3, b: 4 })
  })

  it('handles dynamic typing for numbers', () => {
    const csv = 'x,y\n1,2.5\n3,4'
    const rows = parseCSVText(csv)
    expect(rows[0].x).toBe(1)
    expect(rows[0].y).toBe(2.5)
  })

  it('handles CRLF line endings', () => {
    const csv = 'a,b\r\n1,2\r\n3,4'
    const rows = parseCSVText(csv)
    expect(rows).toHaveLength(2)
  })
})

describe('parsePastedText', () => {
  it('parses tab-delimited pasted text', () => {
    const text = 'x\ty\n1\t2\n3\t4'
    const rows = parsePastedText(text)
    expect(rows).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ])
  })

  it('parses comma-delimited pasted text', () => {
    const text = 'a,b\n1,2\n3,4'
    const rows = parsePastedText(text)
    expect(rows).toEqual([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ])
  })
})
