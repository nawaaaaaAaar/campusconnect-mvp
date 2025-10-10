/**
 * Performance Monitoring Utilities
 * Track and report application performance metrics
 */

import { trackPerformance } from './sentry'

interface PerformanceMetrics {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

/**
 * Web Vitals thresholds
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
}

/**
 * Get rating based on thresholds
 */
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Report performance metric
 */
function reportMetric(metric: PerformanceMetrics) {
  // Log to console in development
  if (import.meta.env.DEV) {
    const emoji = metric.rating === 'good' ? '✅' : 
                  metric.rating === 'needs-improvement' ? '⚠️' : '❌'
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
  }
  
  // Send to Sentry in production
  if (import.meta.env.PROD) {
    trackPerformance(metric.name, metric.value, 'ms')
  }
  
  // Send to analytics (if configured)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_value: metric.value,
      non_interaction: true,
    })
  }
}

/**
 * Measure Core Web Vitals
 */
export async function measureWebVitals() {
  // Check if browser supports Performance API
  if (!('performance' in window)) {
    console.warn('Performance API not supported')
    return
  }
  
  try {
    const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import('web-vitals')
    
    // Largest Contentful Paint
    onLCP((metric) => {
      reportMetric({
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        timestamp: Date.now(),
      })
    })
    
    // First Input Delay
    onFID((metric) => {
      reportMetric({
        name: 'FID',
        value: metric.value,
        rating: getRating('FID', metric.value),
        timestamp: Date.now(),
      })
    })
    
    // Cumulative Layout Shift
    onCLS((metric) => {
      reportMetric({
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        timestamp: Date.now(),
      })
    })
    
    // First Contentful Paint
    onFCP((metric) => {
      reportMetric({
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        timestamp: Date.now(),
      })
    })
    
    // Time to First Byte
    onTTFB((metric) => {
      reportMetric({
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        timestamp: Date.now(),
      })
    })
  } catch (error) {
    console.error('Failed to measure web vitals:', error)
  }
}

/**
 * Measure custom timing
 */
export function measureTiming(name: string, startMark: string, endMark: string) {
  try {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    
    if (measure) {
      reportMetric({
        name,
        value: measure.duration,
        rating: measure.duration < 100 ? 'good' : 
                measure.duration < 300 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
      })
    }
  } catch (error) {
    console.error(`Failed to measure timing for ${name}:`, error)
  }
}

/**
 * Mark performance milestone
 */
export function markPerformance(name: string) {
  try {
    performance.mark(name)
  } catch (error) {
    console.error(`Failed to mark performance for ${name}:`, error)
  }
}

/**
 * Measure API request performance
 */
export function measureApiRequest(url: string, duration: number, status: number) {
  const rating = duration < 200 ? 'good' :
                 duration < 500 ? 'needs-improvement' : 'poor'
  
  reportMetric({
    name: `API: ${url}`,
    value: duration,
    rating,
    timestamp: Date.now(),
  })
  
  // Track in Sentry
  if (status >= 400) {
    console.warn(`API error: ${url} - ${status} (${duration}ms)`)
  }
}

/**
 * Measure component render time
 */
export function measureComponentRender(componentName: string, renderTime: number) {
  const rating = renderTime < 16 ? 'good' : // 60fps threshold
                 renderTime < 32 ? 'needs-improvement' : 'poor'
  
  reportMetric({
    name: `Render: ${componentName}`,
    value: renderTime,
    rating,
    timestamp: Date.now(),
  })
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  if (!('performance' in window)) return null
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')
  
  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    
    // Paint timing
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    
    // Memory (if available)
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  }
}

/**
 * Log performance summary
 */
export function logPerformanceSummary() {
  const summary = getPerformanceSummary()
  if (!summary) return
  
  console.group('📊 Performance Summary')
  console.log('DNS:', `${summary.dns.toFixed(2)}ms`)
  console.log('TCP:', `${summary.tcp.toFixed(2)}ms`)
  console.log('Request:', `${summary.request.toFixed(2)}ms`)
  console.log('Response:', `${summary.response.toFixed(2)}ms`)
  console.log('DOM:', `${summary.dom.toFixed(2)}ms`)
  console.log('Load:', `${summary.load.toFixed(2)}ms`)
  console.log('FCP:', `${summary.fcp.toFixed(2)}ms`)
  
  if (summary.memory) {
    console.log('Memory:', {
      used: `${(summary.memory.used / 1024 / 1024).toFixed(2)} MB`,
      total: `${(summary.memory.total / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(summary.memory.limit / 1024 / 1024).toFixed(2)} MB`,
    })
  }
  
  console.groupEnd()
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks() {
  if (!('PerformanceObserver' in window)) return
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`)
          
          if (import.meta.env.PROD) {
            trackPerformance('long-task', entry.duration, 'ms')
          }
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    // Long Tasks API not supported
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  // Measure Web Vitals
  measureWebVitals()
  
  // Monitor long tasks
  monitorLongTasks()
  
  // Log summary on load
  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      setTimeout(logPerformanceSummary, 1000)
    })
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

