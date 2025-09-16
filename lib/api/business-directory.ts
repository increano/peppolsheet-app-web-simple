/**
 * Business Directory API Client for Frontend
 * Interfaces with the backend business directory service
 */

// Simple API client utilities
const createSimpleApiClient = (baseUrl: string, defaultHeaders: Record<string, string> = {}) => {
  return {
    post: async <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    get: async <T>(url: string, headers?: Record<string, string>): Promise<T> => {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'GET',
        headers: { ...defaultHeaders, ...headers },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  };
};

const simpleWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};

const handleApiError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return 'An unexpected error occurred';
};

// Types matching the backend business directory types
export interface Company {
  unified_id: string;
  company_name: string;
  source_country: string;
  legal_form?: string;
  registration_number?: string;
  vat_number?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  business_info?: {
    industry_code?: string;
    industry_description?: string;
    employee_count?: number;
    founding_date?: string;
  };
  peppol_info?: {
    is_registered: boolean;
    participant_id?: string;
    supported_document_types?: string[];
    last_updated?: string;
  };
  data_quality?: {
    completeness_score: number;
    last_verified?: string;
    source_reliability: 'high' | 'medium' | 'low';
  };
  metadata?: {
    created_at: string;
    updated_at: string;
    source_system: string;
  };
}

export interface CompanySearchResponse {
  companies: Company[];
  total_count: number;
  page: number;
  page_size: number;
  has_next_page: boolean;
  search_metadata?: {
    query_time_ms: number;
    data_sources_used: string[];
    filters_applied: string[];
  };
}

export interface SearchParams {
  query: string;
  countries?: string[];
  page?: number;
  page_size?: number;
  include_peppol_info?: boolean;
  min_completeness_score?: number;
  industry_codes?: string[];
  legal_forms?: string[];
}

export interface BusinessDirectoryConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
}

/**
 * Business Directory API Client
 */
export class BusinessDirectoryClient {
  private apiClient: ReturnType<typeof createSimpleApiClient>;
  private config: BusinessDirectoryConfig;

  constructor(config: BusinessDirectoryConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
      ...config,
    };

    this.apiClient = createSimpleApiClient(this.config.baseUrl, {
      'Content-Type': 'application/json',
    });
  }

  /**
   * Search companies by name
   */
  async searchByName(
    companyName: string,
    countries: string[] = [],
    pageSize: number = 10
  ): Promise<CompanySearchResponse> {
    const params: SearchParams = {
      query: companyName,
      countries,
      page_size: pageSize,
      include_peppol_info: true,
    };

    const searchFn = async () => {
      return await this.apiClient.post<CompanySearchResponse>('/search/name', params);
    };

    return simpleWithRetry(searchFn, this.config.retryAttempts);
  }

  /**
   * Search companies by registration number
   */
  async searchByRegistrationNumber(
    registrationNumber: string,
    countries: string[] = []
  ): Promise<CompanySearchResponse> {
    const params: SearchParams = {
      query: registrationNumber,
      countries,
      page_size: 10,
      include_peppol_info: true,
    };

    const searchFn = async () => {
      return await this.apiClient.post<CompanySearchResponse>('/search/registration_number', params);
    };

    return simpleWithRetry(searchFn, this.config.retryAttempts);
  }

  /**
   * Search companies by VAT number
   */
  async searchByVatNumber(
    vatNumber: string,
    countries: string[] = []
  ): Promise<CompanySearchResponse> {
    const params: SearchParams = {
      query: vatNumber,
      countries,
      page_size: 10,
      include_peppol_info: true,
    };

    const searchFn = async () => {
      return await this.apiClient.post<CompanySearchResponse>('/search/vat_number', params);
    };

    return simpleWithRetry(searchFn, this.config.retryAttempts);
  }

  /**
   * Advanced search with multiple filters
   */
  async advancedSearch(params: SearchParams): Promise<CompanySearchResponse> {
    const searchFn = async () => {
      return await this.apiClient.post<CompanySearchResponse>('/search/advanced', {
        ...params,
        include_peppol_info: true,
      });
    };

    return simpleWithRetry(searchFn, this.config.retryAttempts);
  }

  /**
   * Get company details by unified ID
   */
  async getCompanyById(unifiedId: string): Promise<Company> {
    const fetchFn = async () => {
      return await this.apiClient.get<Company>(`/company/${unifiedId}`);
    };

    return simpleWithRetry(fetchFn, this.config.retryAttempts);
  }

  /**
   * Get PEPPOL information for a company
   */
  async getPeppolInfo(unifiedId: string): Promise<Company['peppol_info']> {
    const fetchFn = async () => {
      return await this.apiClient.get<Company['peppol_info']>(`/company/${unifiedId}/peppol`);
    };

    return simpleWithRetry(fetchFn, this.config.retryAttempts);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return await this.apiClient.get<{ status: string; timestamp: string }>('/health');
  }
}

/**
 * Factory function to create a configured business directory client
 */
export const createBusinessDirectoryClient = (baseUrl?: string): BusinessDirectoryClient => {
  const config: BusinessDirectoryConfig = {
    baseUrl: baseUrl || process.env.NEXT_PUBLIC_BUSINESS_DIRECTORY_API_URL || 'http://localhost:8000/api/v2',
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
  };

  return new BusinessDirectoryClient(config);
};

/**
 * Default client instance
 */
export const businessDirectoryClient = createBusinessDirectoryClient();

/**
 * React hook for business directory operations
 */
export const useBusinessDirectory = () => {
  const client = businessDirectoryClient;

  return {
    searchByName: client.searchByName.bind(client),
    searchByRegistrationNumber: client.searchByRegistrationNumber.bind(client),
    searchByVatNumber: client.searchByVatNumber.bind(client),
    advancedSearch: client.advancedSearch.bind(client),
    getCompanyById: client.getCompanyById.bind(client),
    getPeppolInfo: client.getPeppolInfo.bind(client),
    healthCheck: client.healthCheck.bind(client),
  };
};

/**
 * Utility functions for company data
 */
export const companyUtils = {
  /**
   * Format company address as string
   */
  formatAddress: (address?: Company['address']): string => {
    if (!address) return '';
    
    const parts = [
      address.street,
      address.city,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  },

  /**
   * Get company display name
   */
  getDisplayName: (company: Company): string => {
    return company.company_name;
  },

  /**
   * Check if company has PEPPOL registration
   */
  hasPeppol: (company: Company): boolean => {
    return company.peppol_info?.is_registered === true;
  },

  /**
   * Get completeness score color
   */
  getCompletenessColor: (score: number): string => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  },

  /**
   * Format country code to flag emoji
   */
  getCountryFlag: (countryCode: string): string => {
    const flags: Record<string, string> = {
      'BE': '🇧🇪',
      'FR': '🇫🇷',
      'DE': '🇩🇪',
      'NL': '🇳🇱',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'AT': '🇦🇹',
      'DK': '🇩🇰',
      'SE': '🇸🇪',
      'FI': '🇫🇮',
    };
    
    return flags[countryCode] || '🌍';
  },
};

// Export error handler
export { handleApiError };
