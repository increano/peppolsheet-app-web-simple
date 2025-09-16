import { StorecoveConfig } from './types';

/**
 * Get StoreCove configuration from environment variables
 */
export function getStorecoveConfig(): StorecoveConfig {
  const apiKey = process.env.STORECOVE_API_KEY;
  
  if (!apiKey) {
    throw new Error('STORECOVE_API_KEY environment variable is required');
  }

  return {
    apiKey,
    baseUrl: process.env.STORECOVE_BASE_URL || 'https://api.storecove.com/api/v2',
    timeout: parseInt(process.env.STORECOVE_TIMEOUT || '30000', 10)
  };
}

/**
 * Create a StoreCove client instance with environment configuration
 */
export function createStorecoveClient(): import('./client').StorecoveClient {
  const { StorecoveClient } = require('./client');
  return new StorecoveClient(getStorecoveConfig());
}
