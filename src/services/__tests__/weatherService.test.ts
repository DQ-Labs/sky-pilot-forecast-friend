import { describe, it, expect } from 'vitest'

// Import the functions we want to test
// Note: We'll need to export these functions from weatherService.ts
import { determineCondition, calculateCloudCeiling } from '../weatherService'

describe('Weather Service - Pure Functions', () => {
  describe('determineCondition', () => {
    it('should return "good" for ideal flying conditions', () => {
      const result = determineCondition(5, 0, 3000)
      expect(result).toBe('good')
    })

    it('should return "poor" for high wind speeds', () => {
      const result = determineCondition(16, 0, 3000)
      expect(result).toBe('poor')
    })

    it('should return "poor" for high precipitation', () => {
      const result = determineCondition(5, 51, 3000)
      expect(result).toBe('poor')
    })

    it('should return "poor" for low cloud ceiling', () => {
      const result = determineCondition(5, 0, 300)
      expect(result).toBe('poor')
    })

    it('should return "caution" for moderate wind speeds', () => {
      const result = determineCondition(12, 0, 3000)
      expect(result).toBe('caution')
    })

    it('should return "caution" for moderate precipitation', () => {
      const result = determineCondition(5, 25, 3000)
      expect(result).toBe('caution')
    })

    it('should return "caution" for moderate cloud ceiling', () => {
      const result = determineCondition(5, 0, 600)
      expect(result).toBe('caution')
    })

    it('should handle edge cases at boundary values', () => {
      // Wind speed boundary (10 mph for caution)
      expect(determineCondition(10, 0, 3000)).toBe('good')
      expect(determineCondition(11, 0, 3000)).toBe('caution')
      
      // Wind speed boundary (15 mph for poor)
      expect(determineCondition(15, 0, 3000)).toBe('caution')
      expect(determineCondition(16, 0, 3000)).toBe('poor')
      
      // Precipitation boundary (20% for caution)
      expect(determineCondition(5, 20, 3000)).toBe('good')
      expect(determineCondition(5, 21, 3000)).toBe('caution')
      
      // Precipitation boundary (50% for poor)
      expect(determineCondition(5, 50, 3000)).toBe('caution')
      expect(determineCondition(5, 51, 3000)).toBe('poor')
      
      // Cloud ceiling boundary (400 ft for poor)
      expect(determineCondition(5, 0, 400)).toBe('poor')
      expect(determineCondition(5, 0, 399)).toBe('poor')
      
      // Cloud ceiling boundary (800 ft for caution)
      expect(determineCondition(5, 0, 800)).toBe('caution')
      expect(determineCondition(5, 0, 799)).toBe('caution')
      expect(determineCondition(5, 0, 801)).toBe('good')
    })

    it('should prioritize worst condition when multiple factors are problematic', () => {
      // High wind + high precipitation + low ceiling = poor
      const result = determineCondition(25, 80, 300)
      expect(result).toBe('poor')
    })
  })

  describe('calculateCloudCeiling', () => {
    it('should return high ceiling for clear skies (0% cloud cover)', () => {
      const result = calculateCloudCeiling(0)
      expect(result).toBe(8000)
    })

    it('should return low ceiling for very overcast skies (90%+ cloud cover)', () => {
      const result = calculateCloudCeiling(90)
      expect(result).toBe(500)
    })

    it('should return medium ceiling for moderate cloud cover (50-69%)', () => {
      const result = calculateCloudCeiling(60)
      expect(result).toBe(2000)
    })

    it('should handle boundary conditions correctly', () => {
      // Test exact boundary values from the implementation
      expect(calculateCloudCeiling(90)).toBe(500)  // >= 90
      expect(calculateCloudCeiling(89)).toBe(1000) // >= 70 && < 90
      
      expect(calculateCloudCeiling(70)).toBe(1000) // >= 70
      expect(calculateCloudCeiling(69)).toBe(2000) // >= 50 && < 70
      
      expect(calculateCloudCeiling(50)).toBe(2000) // >= 50
      expect(calculateCloudCeiling(49)).toBe(4000) // >= 20 && < 50
      
      expect(calculateCloudCeiling(20)).toBe(4000) // >= 20
      expect(calculateCloudCeiling(19)).toBe(8000) // < 20
    })

    it('should handle edge cases with exact values', () => {
      // Clear skies
      expect(calculateCloudCeiling(0)).toBe(8000)
      expect(calculateCloudCeiling(10)).toBe(8000)
      
      // Partly cloudy
      expect(calculateCloudCeiling(25)).toBe(4000)
      expect(calculateCloudCeiling(40)).toBe(4000)
      
      // Mostly cloudy
      expect(calculateCloudCeiling(55)).toBe(2000)
      expect(calculateCloudCeiling(75)).toBe(1000)
      
      // Overcast
      expect(calculateCloudCeiling(95)).toBe(500)
      expect(calculateCloudCeiling(100)).toBe(500)
    })

    it('should return integer values', () => {
      const result = calculateCloudCeiling(33.33)
      expect(Number.isInteger(result)).toBe(true)
    })
  })
})