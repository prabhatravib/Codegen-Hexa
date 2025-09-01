/**
 * Session Manager for coordinating between voice session and external data
 * Ensures both voice and external data use the same session ID
 */

class SessionManager {
  private sessionId: string | null = null
  private listeners: ((sessionId: string | null) => void)[] = []

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    this.sessionId = this.generateUUID()
    this.notifyListeners()
    return this.sessionId
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Set a specific session ID (useful for restoring sessions)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
    this.notifyListeners()
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.sessionId = null
    this.notifyListeners()
  }

  /**
   * Subscribe to session ID changes
   */
  onSessionChange(callback: (sessionId: string | null) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.sessionId))
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()
