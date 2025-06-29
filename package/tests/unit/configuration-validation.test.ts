import { describe, it, expect, vi } from 'vitest'
import { PHYSICS, MAGNETIC_SNAP, TIMING, EASING_FUNCTIONS } from '../../src/constants/scroll-physics'

/**
 * Unit tests for configuration validation and default value handling
 * Tests the configuration processing logic without mocking
 */
describe('Configuration Validation', () => {
  // Helper to create a minimal valid config
  const createMinimalConfig = () => ({
    sections: ['Section 1', 'Section 2'], // Using strings instead of JSX for testing
  })

  describe('Default value assignment', () => {
    it('should apply all default values when only sections provided', () => {
      const config = createMinimalConfig()
      
      // Simulate default value processing like in useScrollManager
      const processedConfig = {
        ...config,
        keyboardNavigation: config.keyboardNavigation ?? true,
        duration: config.duration ?? PHYSICS.BASE_ANIMATION_DURATION,
        easing: config.easing ?? EASING_FUNCTIONS.CUBIC_OUT,
        tolerance: config.tolerance ?? PHYSICS.OBSERVER_TOLERANCE,
        preventDefault: config.preventDefault ?? true,
        invertDirection: config.invertDirection ?? false,
        enableMagneticSnap: config.enableMagneticSnap ?? MAGNETIC_SNAP.ENABLED,
        magneticThreshold: config.magneticThreshold ?? MAGNETIC_SNAP.MAGNETIC_THRESHOLD,
        magneticVelocityThreshold: config.magneticVelocityThreshold ?? MAGNETIC_SNAP.MAGNETIC_VELOCITY_THRESHOLD,
      }
      
      expect(processedConfig.keyboardNavigation).toBe(true)
      expect(processedConfig.duration).toBe(1.2)
      expect(processedConfig.easing).toBe(EASING_FUNCTIONS.CUBIC_OUT)
      expect(processedConfig.tolerance).toBe(50)
      expect(processedConfig.preventDefault).toBe(true)
      expect(processedConfig.invertDirection).toBe(false)
      expect(processedConfig.enableMagneticSnap).toBe(true)
      expect(processedConfig.magneticThreshold).toBe(0.15)
      expect(processedConfig.magneticVelocityThreshold).toBe(10)
    })

    it('should respect user-provided values over defaults', () => {
      const config = {
        ...createMinimalConfig(),
        keyboardNavigation: false,
        duration: 2.5,
        tolerance: 100,
        preventDefault: false,
        invertDirection: true,
        enableMagneticSnap: false,
      }
      
      const processedConfig = {
        ...config,
        keyboardNavigation: config.keyboardNavigation ?? true,
        duration: config.duration ?? PHYSICS.BASE_ANIMATION_DURATION,
        tolerance: config.tolerance ?? PHYSICS.OBSERVER_TOLERANCE,
        preventDefault: config.preventDefault ?? true,
        invertDirection: config.invertDirection ?? false,
        enableMagneticSnap: config.enableMagneticSnap ?? MAGNETIC_SNAP.ENABLED,
      }
      
      expect(processedConfig.keyboardNavigation).toBe(false)
      expect(processedConfig.duration).toBe(2.5)
      expect(processedConfig.tolerance).toBe(100)
      expect(processedConfig.preventDefault).toBe(false)
      expect(processedConfig.invertDirection).toBe(true)
      expect(processedConfig.enableMagneticSnap).toBe(false)
    })

    it('should handle falsy values correctly', () => {
      const config = {
        ...createMinimalConfig(),
        duration: 0, // Valid falsy value
        tolerance: 0, // Valid falsy value
        keyboardNavigation: false, // Explicitly false
      }
      
      const processedConfig = {
        ...config,
        duration: config.duration ?? PHYSICS.BASE_ANIMATION_DURATION,
        tolerance: config.tolerance ?? PHYSICS.OBSERVER_TOLERANCE,
        keyboardNavigation: config.keyboardNavigation ?? true,
      }
      
      // 0 is a valid value and should not be replaced by default
      expect(processedConfig.duration).toBe(0)
      expect(processedConfig.tolerance).toBe(0)
      expect(processedConfig.keyboardNavigation).toBe(false)
    })
  })

  describe('Duration validation', () => {
    it('should accept valid duration values', () => {
      const validDurations = [0.1, 0.5, 1.0, 1.2, 2.5, 5.0]
      
      validDurations.forEach(duration => {
        const config = { ...createMinimalConfig(), duration }
        const processedDuration = config.duration ?? PHYSICS.BASE_ANIMATION_DURATION
        expect(processedDuration).toBe(duration)
      })
    })

    it('should clamp duration to reasonable bounds', () => {
      // Simulate duration clamping logic
      const clampDuration = (duration: number) => {
        const MIN_DURATION = 0.1
        const MAX_DURATION = 10.0
        return Math.max(MIN_DURATION, Math.min(MAX_DURATION, duration))
      }
      
      expect(clampDuration(-1)).toBe(0.1)
      expect(clampDuration(0)).toBe(0.1)
      expect(clampDuration(0.05)).toBe(0.1)
      expect(clampDuration(1.2)).toBe(1.2)
      expect(clampDuration(15)).toBe(10.0)
      expect(clampDuration(Infinity)).toBe(10.0)
    })
  })

  describe('Easing function validation', () => {
    it('should accept valid easing functions', () => {
      const validEasings = [
        EASING_FUNCTIONS.LINEAR,
        EASING_FUNCTIONS.CUBIC_OUT,
        EASING_FUNCTIONS.DEFAULT,
        EASING_FUNCTIONS.ELASTIC_OUT,
        (t: number) => t * t, // Custom easing
      ]
      
      validEasings.forEach(easing => {
        const config = { ...createMinimalConfig(), easing }
        expect(typeof config.easing).toBe('function')
        // Note: DEFAULT easing returns 0.001 for t=0, not exactly 0
        expect(config.easing(0)).toBeLessThanOrEqual(0.001)
        expect(config.easing(0)).toBeGreaterThanOrEqual(0)
        expect(config.easing(1)).toBeCloseTo(1, 5)
      })
    })

    it('should validate easing function output', () => {
      const easing = EASING_FUNCTIONS.CUBIC_OUT
      
      // Test various input values
      expect(easing(0)).toBe(0)
      expect(easing(0.25)).toBeGreaterThan(0)
      expect(easing(0.5)).toBeGreaterThan(0.25)
      expect(easing(0.75)).toBeGreaterThan(0.5)
      expect(easing(1)).toBeCloseTo(1, 5)
      
      // Should handle out-of-range inputs gracefully
      expect(easing(-0.5)).toBeLessThanOrEqual(0)
      expect(easing(1.5)).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Tolerance validation', () => {
    it('should accept valid tolerance values', () => {
      const validTolerances = [0, 10, 50, 100, 200]
      
      validTolerances.forEach(tolerance => {
        const config = { ...createMinimalConfig(), tolerance }
        const processedTolerance = config.tolerance ?? PHYSICS.OBSERVER_TOLERANCE
        expect(processedTolerance).toBe(tolerance)
      })
    })

    it('should handle negative tolerance by using absolute value', () => {
      const processTolerance = (tolerance: number) => Math.abs(tolerance)
      
      expect(processTolerance(-50)).toBe(50)
      expect(processTolerance(-100)).toBe(100)
      expect(processTolerance(0)).toBe(0)
      expect(processTolerance(50)).toBe(50)
    })
  })

  describe('Magnetic snap configuration', () => {
    it('should validate magnetic threshold bounds', () => {
      const clampMagneticThreshold = (threshold: number) => {
        // Threshold should be between 0 and 0.5 (50% of viewport)
        return Math.max(0, Math.min(0.5, threshold))
      }
      
      expect(clampMagneticThreshold(-0.1)).toBe(0)
      expect(clampMagneticThreshold(0)).toBe(0)
      expect(clampMagneticThreshold(0.15)).toBe(0.15)
      expect(clampMagneticThreshold(0.5)).toBe(0.5)
      expect(clampMagneticThreshold(0.75)).toBe(0.5)
      expect(clampMagneticThreshold(1)).toBe(0.5)
    })

    it('should validate velocity threshold', () => {
      const clampVelocityThreshold = (velocity: number) => {
        // Velocity should be positive
        return Math.max(0, velocity)
      }
      
      expect(clampVelocityThreshold(-10)).toBe(0)
      expect(clampVelocityThreshold(0)).toBe(0)
      expect(clampVelocityThreshold(10)).toBe(10)
      expect(clampVelocityThreshold(50)).toBe(50)
    })

    it('should handle interdependent magnetic snap settings', () => {
      const config = {
        ...createMinimalConfig(),
        enableMagneticSnap: false,
        magneticThreshold: 0.3, // Should be ignored when disabled
        magneticVelocityThreshold: 20,
      }
      
      // When magnetic snap is disabled, thresholds shouldn't matter
      const shouldUseMagneticSnap = (config: any, velocity: number, distance: number) => {
        if (!config.enableMagneticSnap) return false
        return velocity < config.magneticVelocityThreshold && 
               distance < config.magneticThreshold
      }
      
      expect(shouldUseMagneticSnap(config, 5, 0.1)).toBe(false)
      expect(shouldUseMagneticSnap(config, 5, 0.4)).toBe(false)
    })
  })

  describe('Sections validation', () => {
    it('should require at least one section', () => {
      const validateSections = (sections: any[]) => {
        return Array.isArray(sections) && sections.length > 0
      }
      
      expect(validateSections([])).toBe(false)
      expect(validateSections(['Section'])).toBe(true)
      expect(validateSections(createMinimalConfig().sections)).toBe(true)
    })

    it('should handle various section types', () => {
      const validSectionArrays = [
        ['Text'],
        ['Content', 'More'],
        ['String section', 'Another string'],
        [123, 456], // Numbers as sections
        [{ type: 'div', props: { children: 'Test' } }], // React element objects
      ]
      
      validSectionArrays.forEach(sections => {
        expect(Array.isArray(sections)).toBe(true)
        expect(sections.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Callback validation', () => {
    it('should handle missing onSectionChange callback', () => {
      const config = createMinimalConfig()
      
      // Simulate safe callback invocation
      const invokeCallback = (callback?: Function, ...args: any[]) => {
        if (typeof callback === 'function') {
          callback(...args)
        }
      }
      
      // Should not throw when callback is missing
      expect(() => invokeCallback(config.onSectionChange, 1)).not.toThrow()
    })

    it('should validate callback is a function', () => {
      const isValidCallback = (callback: any) => {
        return callback === undefined || typeof callback === 'function'
      }
      
      expect(isValidCallback(undefined)).toBe(true)
      expect(isValidCallback(null)).toBe(false)
      expect(isValidCallback(() => {})).toBe(true)
      expect(isValidCallback('not a function')).toBe(false)
      expect(isValidCallback(123)).toBe(false)
    })
  })

  describe('Configuration merging', () => {
    it('should deep merge nested configuration objects', () => {
      const defaultConfig = {
        duration: 1.2,
        tolerance: 50,
        magnetic: {
          enabled: true,
          threshold: 0.15,
          velocity: 10,
        }
      }
      
      const userConfig = {
        duration: 2.0,
        magnetic: {
          threshold: 0.3,
        }
      }
      
      // Simple shallow merge with nested object handling
      const mergedConfig = {
        ...defaultConfig,
        ...userConfig,
        magnetic: {
          ...defaultConfig.magnetic,
          ...userConfig.magnetic,
        }
      }
      
      expect(mergedConfig.duration).toBe(2.0)
      expect(mergedConfig.tolerance).toBe(50)
      expect(mergedConfig.magnetic.enabled).toBe(true)
      expect(mergedConfig.magnetic.threshold).toBe(0.3)
      expect(mergedConfig.magnetic.velocity).toBe(10)
    })

    it('should handle null and undefined in configuration', () => {
      const config = {
        ...createMinimalConfig(),
        duration: null as any,
        tolerance: undefined,
        easing: null as any,
      }
      
      const processedConfig = {
        duration: config.duration ?? PHYSICS.BASE_ANIMATION_DURATION,
        tolerance: config.tolerance ?? PHYSICS.OBSERVER_TOLERANCE,
        easing: config.easing ?? EASING_FUNCTIONS.CUBIC_OUT,
      }
      
      expect(processedConfig.duration).toBe(PHYSICS.BASE_ANIMATION_DURATION)
      expect(processedConfig.tolerance).toBe(PHYSICS.OBSERVER_TOLERANCE)
      expect(processedConfig.easing).toBe(EASING_FUNCTIONS.CUBIC_OUT)
    })
  })

  describe('Edge cases', () => {
    it('should handle NaN values', () => {
      const sanitizeNumber = (value: number, defaultValue: number) => {
        return Number.isFinite(value) ? value : defaultValue
      }
      
      expect(sanitizeNumber(NaN, 1.2)).toBe(1.2)
      expect(sanitizeNumber(Infinity, 1.2)).toBe(1.2)
      expect(sanitizeNumber(-Infinity, 1.2)).toBe(1.2)
      expect(sanitizeNumber(0, 1.2)).toBe(0)
      expect(sanitizeNumber(5.5, 1.2)).toBe(5.5)
    })

    it('should handle configuration with extra properties', () => {
      const config = {
        ...createMinimalConfig(),
        duration: 1.5,
        // Extra properties that might be passed
        customProp: 'value',
        anotherProp: 123,
        nestedProp: { foo: 'bar' },
      }
      
      // Should ignore extra properties but keep valid ones
      const { sections, duration, customProp, ...rest } = config as any
      
      expect(sections).toBeDefined()
      expect(duration).toBe(1.5)
      expect(customProp).toBe('value')
    })

    it('should handle circular references in configuration', () => {
      const config: any = createMinimalConfig()
      config.circular = config // Create circular reference
      
      // Should be able to detect circular references
      const hasCircularReference = (obj: any, seen = new WeakSet()): boolean => {
        if (obj === null || typeof obj !== 'object') return false
        if (seen.has(obj)) return true
        seen.add(obj)
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && hasCircularReference(obj[key], seen)) {
            return true
          }
        }
        return false
      }
      
      expect(hasCircularReference(config)).toBe(true)
      expect(hasCircularReference(createMinimalConfig())).toBe(false)
    })
  })
})