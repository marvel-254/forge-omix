import { describe, it, expect } from 'vitest'
import {
  parseChartValues,
  resolveChartData,
  getChartLengthWarnings,
} from '@client/canvas/registry'

/**
 * Unit tests for the structured chart-data resolution that backs the
 * repeatable dataset-row editor in the canvas registry (replacing the old
 * raw-JSON textarea).
 */
describe('parseChartValues', () => {
  it('parses comma-separated numbers with whitespace', () => {
    expect(parseChartValues('1, 2 ,3')).toEqual([1, 2, 3])
  })

  it('parses decimals and negatives', () => {
    expect(parseChartValues('-1.5, 2, 0.25')).toEqual([-1.5, 2, 0.25])
  })

  it('tolerates other separators by dropping non-numeric fragments', () => {
    expect(parseChartValues('1;2;3')).toEqual([1, 2, 3])
    expect(parseChartValues('10 20 30')).toEqual([10, 20, 30])
    expect(parseChartValues('a, 4, b, 8')).toEqual([4, 8])
  })

  it('returns [] for empty/garbage input', () => {
    expect(parseChartValues('')).toEqual([])
    expect(parseChartValues('no numbers here')).toEqual([])
    expect(parseChartValues(undefined)).toEqual([])
  })

  it('keeps only finite numbers when given an array', () => {
    expect(parseChartValues([1, 2, 3])).toEqual([1, 2, 3])
    expect(parseChartValues([1, NaN, 3])).toEqual([1, 3])
  })
})

describe('resolveChartData', () => {
  it('programmatic data prop wins over structured rows', () => {
    const data = { labels: ['X'], datasets: [{ data: [1] }] }
    const resolved = resolveChartData({
      data,
      chartLabels: ['Y'],
      datasets: [{ label: 'Row', values: '9' }],
    })
    expect(resolved).toEqual(data)
  })

  it('builds datasets from rows: labels, parsed values, optional color', () => {
    const resolved = resolveChartData({
      chartLabels: ['Q1', 'Q2'],
      datasets: [
        { label: 'Revenue', values: '12, 30' },
        { label: 'Costs', values: '8, 14', color: '#10b981' },
      ],
    })
    expect(resolved).toEqual({
      labels: ['Q1', 'Q2'],
      datasets: [
        { label: 'Revenue', data: [12, 30] },
        { label: 'Costs', data: [8, 14], color: '#10b981' },
      ],
    })
  })

  it('omits empty labels/colors and keeps rows without names usable', () => {
    const resolved = resolveChartData({
      chartLabels: ['A', 42, null, 'B'] as unknown as string[],
      datasets: [{ values: '1, 2' }, { label: '   ', values: '3', color: 'not-a-color{}' }],
    })
    expect(resolved).toEqual({
      labels: ['A', 'B'],
      datasets: [{ data: [1, 2] }, { data: [3] }],
    })
  })

  it('falls back to built-in default data when no rows exist', () => {
    const resolved = resolveChartData({})
    expect(resolved?.datasets?.length).toBeGreaterThan(0)
    expect(resolved?.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  it('falls back to defaults when datasets is not an array', () => {
    const resolved = resolveChartData({ datasets: 'nope' as never })
    expect(resolved?.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })
})

describe('getChartLengthWarnings', () => {
  it('returns [] for null/empty data', () => {
    expect(getChartLengthWarnings(null)).toEqual([])
    expect(getChartLengthWarnings({ labels: [], datasets: [] })).toEqual([])
  })

  it('returns [] when there are no labels to compare against', () => {
    expect(getChartLengthWarnings({ datasets: [{ data: [1, 2] }] })).toEqual([])
  })

  it('returns [] when every dataset matches the label count', () => {
    expect(
      getChartLengthWarnings({
        labels: ['A', 'B', 'C'],
        datasets: [{ label: 'S', data: [1, 2, 3] }],
      })
    ).toEqual([])
  })

  it('flags a mismatch with the series name and both counts', () => {
    expect(
      getChartLengthWarnings({
        labels: ['A', 'B', 'C'],
        datasets: [{ label: 'Revenue', data: [1, 2] }],
      })
    ).toEqual([{ series: 'Revenue', values: 2, labels: 3 }])
  })

  it('names unnamed datasets by 1-based position', () => {
    const warnings = getChartLengthWarnings({
      labels: ['A', 'B'],
      datasets: [{ data: [1] }, { label: '  ', data: [1, 2, 3] }],
    })
    expect(warnings).toEqual([
      { series: 'Dataset 1', values: 1, labels: 2 },
      { series: 'Dataset 2', values: 3, labels: 2 },
    ])
  })

  it('flags empty value rows against labels', () => {
    const warnings = getChartLengthWarnings({
      labels: ['A', 'B'],
      datasets: [{ label: 'Empty', data: [] }],
    })
    expect(warnings).toEqual([{ series: 'Empty', values: 0, labels: 2 }])
  })

  it('only warns for the mismatched series, not matching ones', () => {
    const warnings = getChartLengthWarnings({
      labels: ['A', 'B'],
      datasets: [{ label: 'Good', data: [1, 2] }, { label: 'Bad', data: [1] }],
    })
    expect(warnings).toEqual([{ series: 'Bad', values: 1, labels: 2 }])
  })
})
