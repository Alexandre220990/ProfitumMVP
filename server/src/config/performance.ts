// Configuration des optimisations de performance
// Date: 2025-01-27

export interface PerformanceConfig {
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  compression: {
    enabled: boolean;
    level: number;
    threshold: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  database: {
    connectionPool: {
      min: number;
      max: number;
      idleTimeout: number;
    };
    queryTimeout: number;
  };
  monitoring: {
    enabled: boolean;
    slowQueryThreshold: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export const performanceConfig: PerformanceConfig = {
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL || '300000'), // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  },
  compression: {
    enabled: process.env.COMPRESSION_ENABLED !== 'false',
    level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024')
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },
  database: {
    connectionPool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000')
    },
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000')
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  }
};

// Configuration spécifique par environnement
export const getEnvironmentConfig = (): Partial<PerformanceConfig> => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        cache: {
          enabled: true,
          ttl: 600000, // 10 minutes
          maxSize: 2000
        },
        compression: {
          enabled: true,
          level: 6,
          threshold: 1024
        },
        rateLimit: {
          enabled: true,
          windowMs: 900000, // 15 minutes
          max: 100
        },
        monitoring: {
          enabled: true,
          slowQueryThreshold: 500,
          logLevel: 'warn'
        }
      };
      
    case 'development':
      return {
        cache: {
          enabled: true,
          ttl: 300000, // 5 minutes
          maxSize: 500
        },
        compression: {
          enabled: true,
          level: 4,
          threshold: 512
        },
        rateLimit: {
          enabled: true,
          windowMs: 900000, // 15 minutes
          max: 1000
        },
        monitoring: {
          enabled: true,
          slowQueryThreshold: 1000,
          logLevel: 'debug'
        }
      };
      
    case 'test':
      return {
        cache: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        compression: {
          enabled: false,
          level: 0,
          threshold: 0
        },
        rateLimit: {
          enabled: false,
          windowMs: 0,
          max: 0
        },
        monitoring: {
          enabled: false,
          slowQueryThreshold: 0,
          logLevel: 'error'
        }
      };
      
    default:
      return {};
  }
};

// Configuration finale fusionnée
export const finalConfig: PerformanceConfig = {
  ...performanceConfig,
  ...getEnvironmentConfig()
};

// Fonctions utilitaires pour la configuration
export const isCacheEnabled = (): boolean => finalConfig.cache.enabled;
export const isCompressionEnabled = (): boolean => finalConfig.compression.enabled;
export const isRateLimitEnabled = (): boolean => finalConfig.rateLimit.enabled;
export const isMonitoringEnabled = (): boolean => finalConfig.monitoring.enabled;

export const getCacheConfig = () => finalConfig.cache;
export const getCompressionConfig = () => finalConfig.compression;
export const getRateLimitConfig = () => finalConfig.rateLimit;
export const getDatabaseConfig = () => finalConfig.database;
export const getMonitoringConfig = () => finalConfig.monitoring; 