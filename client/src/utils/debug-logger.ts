import { config } from '@/config/env';

// Système de logs de débogage avancé
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export enum LogCategory {
  API = 'api',
  AUTH = 'auth',
  WEBSOCKET = 'websocket',
  UI = 'ui',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
  component?: string;
  stack?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel = LogLevel.DEBUG;
  private isEnabled = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  private getSessionId(): string {
    return sessionStorage.getItem('session_id') || 'unknown';
  }

  private getUserId(): string | undefined {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id;
  }

  private formatMessage(level: LogLevel, category: LogCategory, message: string, details?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      component: this.getCurrentComponent(),
      stack: level >= LogLevel.ERROR ? new Error().stack : undefined
    };
  }

  private getCurrentComponent(): string {
    // Détecter le composant actuel via Error().stack
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const lines = stack.split('\n');
    const reactLine = lines.find(line => line.includes('react') || line.includes('Component'));
    if (reactLine) {
      const match = reactLine.match(/at\s+(\w+)/);
      return match ? match[1] : 'unknown';
    }
    return 'unknown';
  }

  private addLog(entry: LogEntry) {
    if (!this.isEnabled || entry.level < this.currentLevel) return;

    this.logs.push(entry);
    
    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Afficher dans la console avec formatage
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category.toUpperCase()}]`;
    const component = entry.component ? `[${entry.component}]` : '';
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${component} ${entry.message}`, entry.details || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${component} ${entry.message}`, entry.details || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${component} ${entry.message}`, entry.details || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(`${prefix} ${component} ${entry.message}`, entry.details || '', entry.stack || '');
        break;
    }

    // Envoyer les erreurs critiques au serveur
    if (entry.level >= LogLevel.ERROR) {
      this.sendToServer(entry);
    }
  }

  private async sendToServer(entry: LogEntry) {
    try {
              await fetch(`${config.API_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Erreur envoi log au serveur:', error);
    }
  }

  // Méthodes publiques
  debug(category: LogCategory, message: string, details?: any) {
    this.addLog(this.formatMessage(LogLevel.DEBUG, category, message, details));
  }

  info(category: LogCategory, message: string, details?: any) {
    this.addLog(this.formatMessage(LogLevel.INFO, category, message, details));
  }

  warn(category: LogCategory, message: string, details?: any) {
    this.addLog(this.formatMessage(LogLevel.WARN, category, message, details));
  }

  error(category: LogCategory, message: string, details?: any) {
    this.addLog(this.formatMessage(LogLevel.ERROR, category, message, details));
  }

  critical(category: LogCategory, message: string, details?: any) {
    this.addLog(this.formatMessage(LogLevel.CRITICAL, category, message, details));
  }

  // Méthodes spécialisées
  api(method: string, url: string, status?: number, duration?: number) {
    this.info(LogCategory.API, `${method} ${url}`, { status, duration });
  }

  auth(action: string, success: boolean, details?: any) {
    this.info(LogCategory.AUTH, `Auth ${action}`, { success, ...details });
  }

  websocket(event: string, details?: any) {
    this.info(LogCategory.WEBSOCKET, `WebSocket ${event}`, details);
  }

  performance(operation: string, duration: number, details?: any) {
    this.info(LogCategory.PERFORMANCE, `${operation} took ${duration}ms`, details);
  }

  security(incident: string, details?: any) {
    this.warn(LogCategory.SECURITY, `Security incident: ${incident}`, details);
  }

  // Utilitaires
  getLogs(level?: LogLevel, category?: LogCategory): LogEntry[] {
    let filtered = this.logs;
    
    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }
    
    if (category !== undefined) {
      filtered = filtered.filter(log => log.category === category);
    }
    
    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Instance globale
export const debugLogger = new DebugLogger();

import React from 'react';

// Hook React pour les logs
export function useDebugLogger() {
  return debugLogger;
}

// HOC pour logger les props et re-renders
export function withDebugLogging<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  return function DebugLoggedComponent(props: P) {
    const component = componentName || WrappedComponent.name;
    
    React.useEffect(() => {
      debugLogger.debug(LogCategory.UI, `${component} mounted`, { props });
      
      return () => {
        debugLogger.debug(LogCategory.UI, `${component} unmounted`);
      };
    }, []);

    React.useEffect(() => {
      debugLogger.debug(LogCategory.UI, `${component} props changed`, { props });
    }, [props]);

    return React.createElement(WrappedComponent, props);
  };
} 