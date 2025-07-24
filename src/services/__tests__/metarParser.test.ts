import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseMetarForRCFlying, formatMetarTime } from '../metarParser'
import { MetarData } from '../airportService'

describe('METAR Parser', () => {
  describe('parseMetarForRCFlying', () => {
    const createMockMetar = (overrides: Partial<MetarData> = {}): MetarData => ({
      icao: 'KORD',
      observed: '2024-01-15T12:00:00Z',
      raw_text: 'KORD 151200Z 27010KT 10SM CLR 15/10 A3010',
      flight_category: 'VFR',
      wind: {
        degrees: 270,
        speed_kts: 10,
        speed_mph: 12,
        gust_kts: undefined,
        gust_mph: undefined
      },
      visibility: {
        miles: '10.0',
        meters: '16093'
      },
      clouds: [
        { code: 'CLR', text: 'Clear', feet: 0, meters: 0 }
      ],
      conditions: [],
      temperature: { celsius: 15, fahrenheit: 59 },
      dewpoint: { celsius: 10, fahrenheit: 50 },
      humidity_percent: 65,
      barometer: { hg: 30.10, hpa: 1019 },
      ...overrides
    })

    it('should return good conditions for ideal weather', () => {
      const metar = createMockMetar()
      const result = parseMetarForRCFlying(metar)

      expect(result.windCondition).toBe('good')
      expect(result.visibilityCondition).toBe('good')
      expect(result.cloudCondition).toBe('good')
      expect(result.overallCondition).toBe('good')
      expect(result.flightCategory).toBe('VFR')
      expect(result.rcFlightRecommendation).toContain('Excellent conditions')
    })

    it('should detect poor wind conditions', () => {
      const metar = createMockMetar({
        wind: { degrees: 270, speed_kts: 30, speed_mph: 35, gust_kts: 35, gust_mph: 40 }
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.windCondition).toBe('poor')
      expect(result.overallCondition).toBe('poor')
    })

    it('should detect caution wind conditions with gusts', () => {
      const metar = createMockMetar({
        wind: { degrees: 270, speed_kts: 12, speed_mph: 14, gust_kts: 18, gust_mph: 21 }
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.windCondition).toBe('caution')
    })

    it('should detect poor visibility conditions', () => {
      const metar = createMockMetar({
        visibility: { miles: '2.0', meters: '3218' }
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.visibilityCondition).toBe('poor')
      expect(result.overallCondition).toBe('poor')
    })

    it('should detect caution visibility conditions', () => {
      const metar = createMockMetar({
        visibility: { miles: '4.0', meters: '6437' }
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.visibilityCondition).toBe('caution')
      expect(result.overallCondition).toBe('caution')
    })

    it('should detect poor cloud conditions', () => {
      const metar = createMockMetar({
        clouds: [
          { code: 'BKN', text: 'Broken', feet: 800, meters: 244 }
        ]
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.cloudCondition).toBe('poor')
      expect(result.overallCondition).toBe('poor')
    })

    it('should detect caution cloud conditions', () => {
      const metar = createMockMetar({
        clouds: [
          { code: 'SCT', text: 'Scattered', feet: 1500, meters: 457 }
        ]
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.cloudCondition).toBe('caution')
      expect(result.overallCondition).toBe('caution')
    })

    it('should ignore clear sky conditions', () => {
      const metar = createMockMetar({
        clouds: [
          { code: 'CLR', text: 'Clear', feet: 0, meters: 0 },
          { code: 'SKC', text: 'Sky Clear', feet: 0, meters: 0 }
        ]
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.cloudCondition).toBe('good')
    })

    it('should find lowest cloud base when multiple layers exist', () => {
      const metar = createMockMetar({
        clouds: [
          { code: 'FEW', text: 'Few', feet: 3000, meters: 914 },
          { code: 'BKN', text: 'Broken', feet: 1200, meters: 366 },
          { code: 'OVC', text: 'Overcast', feet: 5000, meters: 1524 }
        ]
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.cloudCondition).toBe('caution') // 1200 ft is in caution range
    })

    it('should prioritize worst condition for overall assessment', () => {
      const metar = createMockMetar({
        wind: { degrees: 270, speed_kts: 5, speed_mph: 6 }, // good
        visibility: { miles: '8.0', meters: '12874' }, // good
        clouds: [{ code: 'OVC', text: 'Overcast', feet: 500, meters: 152 }] // poor
      })
      const result = parseMetarForRCFlying(metar)

      expect(result.windCondition).toBe('good')
      expect(result.visibilityCondition).toBe('good')
      expect(result.cloudCondition).toBe('poor')
      expect(result.overallCondition).toBe('poor')
    })

    it('should generate appropriate recommendations', () => {
      const cautionMetar = createMockMetar({
        wind: { degrees: 270, speed_kts: 18, speed_mph: 21 },
        visibility: { miles: '4.0', meters: '6437' }
      })
      const result = parseMetarForRCFlying(cautionMetar)

      expect(result.rcFlightRecommendation).toContain('caution')
      expect(result.rcFlightRecommendation).toContain('gusty winds')
      expect(result.rcFlightRecommendation).toContain('reduced visibility')
    })

    it('should handle boundary conditions correctly', () => {
      // Test exact boundary values
      const windBoundary = createMockMetar({
        wind: { degrees: 270, speed_kts: 15, speed_mph: 17 }
      })
      expect(parseMetarForRCFlying(windBoundary).windCondition).toBe('good')

      const windCaution = createMockMetar({
        wind: { degrees: 270, speed_kts: 16, speed_mph: 18 }
      })
      expect(parseMetarForRCFlying(windCaution).windCondition).toBe('caution')
    })
  })

  describe('formatMetarTime', () => {
    beforeEach(() => {
      // Mock current time to be consistent
      vi.setSystemTime(new Date('2024-01-15T14:30:00Z'))
    })

    it('should format recent observations in minutes', () => {
      const observed = '2024-01-15T14:25:00Z' // 5 minutes ago
      const result = formatMetarTime(observed)
      expect(result).toBe('5 minutes ago')
    })

    it('should format observations within an hour', () => {
      const observed = '2024-01-15T14:00:00Z' // 30 minutes ago
      const result = formatMetarTime(observed)
      expect(result).toBe('30 minutes ago')
    })

    it('should format observations in hours for same day', () => {
      const observed = '2024-01-15T12:30:00Z' // 2 hours ago
      const result = formatMetarTime(observed)
      expect(result).toBe('2 hours ago')
    })

    it('should format single hour correctly', () => {
      const observed = '2024-01-15T13:30:00Z' // 1 hour ago
      const result = formatMetarTime(observed)
      expect(result).toBe('1 hour ago')
    })

    it('should use full date for old observations', () => {
      const observed = '2024-01-14T12:30:00Z' // More than 24 hours ago
      const result = formatMetarTime(observed)
      expect(result).toContain('1/14/2024') // Should contain date
    })

    it('should handle edge case of exactly 1 hour', () => {
      const observed = '2024-01-15T13:30:00Z' // Exactly 60 minutes ago
      const result = formatMetarTime(observed)
      expect(result).toBe('1 hour ago')
    })
  })
})