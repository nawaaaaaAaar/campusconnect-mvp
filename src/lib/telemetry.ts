// PRD Section 14: Telemetry & Analytics
// Tracks user actions and system events for analytics and debugging

import { supabase } from './supabase'

interface TelemetryEvent {
  event: string
  ts: string
  user_id?: string
  institute_id?: string
  society_id?: string
  post_id?: string
  device: string
  app_version: string
  latency_ms?: number
  post_count?: number
  feed_type?: string
  reason?: string
  metadata?: Record<string, any>
  [key: string]: any // Allow additional dynamic properties
}

interface PerformanceMetric {
  operation: string
  latency_ms: number
  timestamp: string
  success: boolean
  error_message?: string
}

class TelemetryService {
  private appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
  private events: TelemetryEvent[] = []
  private metrics: PerformanceMetric[] = []
  private flushInterval = 30000 // Flush every 30 seconds
  private maxBatchSize = 50
  private enabled = true

  constructor() {
    // Auto-flush events periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval)
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush())
    }
  }

  /**
   * Track a user action or system event
   * PRD 14: Events to track include:
   * - auth_verify_otp, auth_oauth_login, profile_complete
   * - search_suggest_view, search_result_click
   * - follow_add, follow_remove
   * - feed_impression, feed_next_page
   * - post_publish, post_like, post_comment
   * - share_clicked, share_completed
   * - notification_sent, notification_received, notification_opened
   * - report_created
   * - moderation_action, verification_decision
   */
  track(event: string, data: Partial<Omit<TelemetryEvent, 'event' | 'ts' | 'device' | 'app_version'>> = {}) {
    if (!this.enabled) return

    const telemetryEvent: TelemetryEvent = {
      event,
      ts: new Date().toISOString(),
      device: this.getDeviceType(),
      app_version: this.appVersion,
      ...data
    }

    this.events.push(telemetryEvent)

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Telemetry]', event, data)
    }

    // Auto-flush if batch is full
    if (this.events.length >= this.maxBatchSize) {
      this.flush()
    }
  }

  /**
   * Track performance metrics
   * PRD 14: Track p95 latency for:
   * - Search: p95 ≤500ms
   * - Feed first page: p95 ≤700ms
   * - Feed next page: p95 ≤600ms
   */
  trackPerformance(operation: string, latency_ms: number, success = true, error_message?: string) {
    if (!this.enabled) return

    const metric: PerformanceMetric = {
      operation,
      latency_ms,
      timestamp: new Date().toISOString(),
      success,
      error_message
    }

    this.metrics.push(metric)

    // Log slow operations in development
    if (import.meta.env.DEV) {
      const thresholds: Record<string, number> = {
        'search': 500,
        'feed_first_page': 700,
        'feed_next_page': 600
      }
      
      const threshold = thresholds[operation] || 1000
      if (latency_ms > threshold) {
        console.warn(`[Performance] ${operation} took ${latency_ms}ms (threshold: ${threshold}ms)`)
      }
    }

    // Track as telemetry event
    this.track(`perf_${operation}`, {
      latency_ms,
      metadata: { success, error_message }
    })
  }

  /**
   * Measure execution time of an async operation
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    let success = true
    let error_message: string | undefined

    try {
      const result = await fn()
      return result
    } catch (error: any) {
      success = false
      error_message = error.message || 'Unknown error'
      throw error
    } finally {
      const latency = performance.now() - startTime
      this.trackPerformance(operation, latency, success, error_message)
    }
  }

  /**
   * Get calculated p95 latency for an operation
   */
  getP95Latency(operation: string): number | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.success)
    
    if (operationMetrics.length === 0) return null

    const latencies = operationMetrics.map(m => m.latency_ms).sort((a, b) => a - b)
    const p95Index = Math.floor(latencies.length * 0.95)
    
    return latencies[p95Index]
  }

  /**
   * Flush events to backend
   */
  private async flush() {
    if (this.events.length === 0 && this.metrics.length === 0) return

    const eventsToSend = [...this.events]
    const metricsToSend = [...this.metrics]
    
    // Clear arrays
    this.events = []
    this.metrics = []

    try {
      // Send to analytics backend
      // In production, this would send to Supabase Edge Function or external analytics service
      if (!import.meta.env.DEV) {
        // Only send events to analytics API, metrics are handled separately
        await this.flushToServer(eventsToSend)
        // Metrics can be sent as events or handled differently
        if (metricsToSend.length > 0) {
          console.debug(`[Telemetry] Skipping ${metricsToSend.length} performance metrics (separate pipeline)`)
        }
      }
    } catch (error) {
      // Only log critical errors, not API unavailability
      if (!(error instanceof TypeError && error.message.includes('Failed to fetch'))) {
        console.debug('[Telemetry] Failed to flush events:', error)
      }
      // Re-add events if flush failed (with limit to prevent unbounded growth)
      this.events = [...eventsToSend.slice(0, this.maxBatchSize), ...this.events]
      this.metrics = [...metricsToSend.slice(0, this.maxBatchSize), ...this.metrics]
    }
  }

  private async flushToServer(events: TelemetryEvent[]): Promise<boolean> {
    if (events.length === 0) return true

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify(events)
      })

      if (response.ok) {
        return true
      } else if (response.status === 404) {
        // Analytics API not deployed - silently ignore
        console.debug('[Telemetry] Analytics API not available, events will be dropped')
        return true
      } else {
        console.debug(`[Telemetry] Analytics API returned ${response.status}, events will be dropped`)
        return false
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Network error or API unavailable - silently ignore
        console.debug('[Telemetry] Analytics API unavailable, events will be dropped')
      } else {
        console.debug('[Telemetry] Analytics API error:', error)
      }
      return false
    }
  }

  /**
   * Get device type (mobile/tablet/desktop)
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    const width = window.innerWidth
    
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * Get all collected events (for debugging)
   */
  getEvents() {
    return [...this.events]
  }

  /**
   * Get all collected metrics (for debugging)
   */
  getMetrics() {
    return [...this.metrics]
  }

  /**
   * Clear all collected data
   */
  clear() {
    this.events = []
    this.metrics = []
  }
}

// Export singleton instance
export const telemetry = new TelemetryService()

// Export type definitions
export type { TelemetryEvent, PerformanceMetric }

