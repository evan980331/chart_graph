import { beforeAll, describe, it, expect, vi } from 'vitest'

beforeAll(() => {
  const mem: Record<string, string> = {}
  globalThis.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => {
      mem[k] = String(v)
    },
    removeItem: (k: string) => {
      delete mem[k]
    },
    clear: () => {
      for (const k of Object.keys(mem)) delete mem[k]
    },
    key: (i: number) => Object.keys(mem)[i] ?? null,
    length: 0,
  } as Storage
})

import { useChartStore } from './useChartStore'

describe('undo/redo (zundo)', () => {
  it('records history and reverts styleConfig via temporal undo', () => {
    const initial = useChartStore.getState().styleConfig.fontSize
    useChartStore.getState().setStyleConfig({ ...useChartStore.getState().styleConfig, fontSize: 99 })
    expect(useChartStore.getState().styleConfig.fontSize).toBe(99)

    const past = useChartStore.temporal.getState().pastStates
    expect(past.length).toBeGreaterThan(0)

    useChartStore.temporal.getState().undo()
    expect(useChartStore.getState().styleConfig.fontSize).toBe(initial)
  })

  it('redo restores the undone change', () => {
    useChartStore.getState().setStyleConfig({ ...useChartStore.getState().styleConfig, fontSize: 77 })
    useChartStore.temporal.getState().undo()
    expect(useChartStore.getState().styleConfig.fontSize).not.toBe(77)
    useChartStore.temporal.getState().redo()
    expect(useChartStore.getState().styleConfig.fontSize).toBe(77)
  })

  it('reverts chartType', () => {
    useChartStore.getState().setChartType('bar')
    expect(useChartStore.getState().chartType).toBe('bar')
    useChartStore.temporal.getState().undo()
    expect(useChartStore.getState().chartType).not.toBe('bar')
  })

  it('temporal.subscribe fires so useUndoRedo canUndo updates', () => {
    let lastPast: unknown[] = []
    const unsub = useChartStore.temporal.subscribe((s) => {
      lastPast = s.pastStates
    })
    const baseline = lastPast.length
    useChartStore.getState().setStyleConfig({ ...useChartStore.getState().styleConfig, fontSize: 55 })
    expect(lastPast.length).toBeGreaterThan(baseline)
    unsub()
  })

  it('reverts chart title (config.title)', () => {
    const initial = useChartStore.getState().config.title
    useChartStore.getState().setConfig({ ...useChartStore.getState().config, title: 'Undo Title X' })
    expect(useChartStore.getState().config.title).toBe('Undo Title X')
    useChartStore.temporal.getState().undo()
    expect(useChartStore.getState().config.title).toBe(initial)
  })

  it('coalesces rapid previewSize changes into a single undo step', () => {
    const before = useChartStore.getState().previewSize
    vi.useFakeTimers()
    for (let i = 1; i <= 10; i++) {
      useChartStore.getState().setPreviewSize({ width: 100 + i, height: 100 + i })
    }
    const pastBefore = useChartStore.temporal.getState().pastStates.length
    vi.advanceTimersByTime(400)
    const pastAfter = useChartStore.temporal.getState().pastStates.length
    expect(pastAfter).toBe(pastBefore + 1)
    vi.useRealTimers()
    useChartStore.temporal.getState().undo()
    expect(useChartStore.getState().previewSize).toEqual(before)
  })
})
