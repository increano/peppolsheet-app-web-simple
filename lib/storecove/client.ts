import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  StorecoveConfig,
  LegalEntity,
  PeppolIdentifier,
  Invoice,
  Webhook,
  ShopAccount,
  PreflightResult,
  CreateLegalEntityRequest,
  CreatePeppolIdentifierRequest,
  SendInvoiceRequest,
  CreateWebhookRequest,
  CreateShopAccountRequest,
  ApiResponse,
  PaginatedResponse,
  PeppolLookupRequest,
  PeppolLookupResponse
} from './types';

export class StorecoveClient {
  private client: AxiosInstance;
  private config: StorecoveConfig;

  constructor(config: StorecoveConfig) {
    this.config = {
      baseUrl: 'https://api.storecove.com/api/v2',
      timeout: 30000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('Network Error:', error.message);
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Legal Entity Management
  async getLegalEntities(): Promise<PaginatedResponse<LegalEntity>> {
    const response: AxiosResponse<PaginatedResponse<LegalEntity>> = 
      await this.client.get('/legal_entities');
    return response.data;
  }

  async getLegalEntity(id: number): Promise<LegalEntity> {
    const response: AxiosResponse<LegalEntity> = 
      await this.client.get(`/legal_entities/${id}`);
    return response.data;
  }

  async createLegalEntity(data: CreateLegalEntityRequest): Promise<LegalEntity> {
    const response: AxiosResponse<LegalEntity> = 
      await this.client.post('/legal_entities', data);
    return response.data;
  }

  async updateLegalEntity(id: number, data: Partial<CreateLegalEntityRequest>): Promise<LegalEntity> {
    const response: AxiosResponse<LegalEntity> = 
      await this.client.put(`/legal_entities/${id}`, data);
    return response.data;
  }

  async deleteLegalEntity(id: number): Promise<void> {
    await this.client.delete(`/legal_entities/${id}`);
  }

  // Peppol Identifier Management
  async getPeppolIdentifiers(legalEntityId: number): Promise<PaginatedResponse<PeppolIdentifier>> {
    const response: AxiosResponse<PaginatedResponse<PeppolIdentifier>> = 
      await this.client.get(`/legal_entities/${legalEntityId}/peppol_identifiers`);
    return response.data;
  }

  async getPeppolIdentifier(id: number): Promise<PeppolIdentifier> {
    const response: AxiosResponse<PeppolIdentifier> = 
      await this.client.get(`/peppol_identifiers/${id}`);
    return response.data;
  }

  async createPeppolIdentifier(data: CreatePeppolIdentifierRequest): Promise<PeppolIdentifier> {
    const response: AxiosResponse<PeppolIdentifier> = 
      await this.client.post('/peppol_identifiers', data);
    return response.data;
  }

  async updatePeppolIdentifier(id: number, data: Partial<CreatePeppolIdentifierRequest>): Promise<PeppolIdentifier> {
    const response: AxiosResponse<PeppolIdentifier> = 
      await this.client.put(`/peppol_identifiers/${id}`, data);
    return response.data;
  }

  async deletePeppolIdentifier(id: number): Promise<void> {
    await this.client.delete(`/peppol_identifiers/${id}`);
  }

  // Invoice Management
  async getInvoices(legalEntityId: number): Promise<PaginatedResponse<Invoice>> {
    const response: AxiosResponse<PaginatedResponse<Invoice>> = 
      await this.client.get(`/legal_entities/${legalEntityId}/invoices`);
    return response.data;
  }

  async getInvoice(id: number): Promise<Invoice> {
    const response: AxiosResponse<Invoice> = 
      await this.client.get(`/invoices/${id}`);
    return response.data;
  }

  async sendInvoice(data: SendInvoiceRequest): Promise<Invoice> {
    const response: AxiosResponse<Invoice> = 
      await this.client.post('/invoices', data);
    return response.data;
  }

  async preflightInvoice(data: Omit<SendInvoiceRequest, 'legal_entity_id'>): Promise<PreflightResult> {
    const response: AxiosResponse<PreflightResult> = 
      await this.client.post('/invoices/preflight', data);
    return response.data;
  }

  // Webhook Management
  async getWebhooks(legalEntityId: number): Promise<PaginatedResponse<Webhook>> {
    const response: AxiosResponse<PaginatedResponse<Webhook>> = 
      await this.client.get(`/legal_entities/${legalEntityId}/webhooks`);
    return response.data;
  }

  async getWebhook(id: number): Promise<Webhook> {
    const response: AxiosResponse<Webhook> = 
      await this.client.get(`/webhooks/${id}`);
    return response.data;
  }

  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    const response: AxiosResponse<Webhook> = 
      await this.client.post('/webhooks', data);
    return response.data;
  }

  async updateWebhook(id: number, data: Partial<CreateWebhookRequest>): Promise<Webhook> {
    const response: AxiosResponse<Webhook> = 
      await this.client.put(`/webhooks/${id}`, data);
    return response.data;
  }

  async deleteWebhook(id: number): Promise<void> {
    await this.client.delete(`/webhooks/${id}`);
  }

  // Shop Account Management (Embedded Supplier Connections)
  async getShopAccounts(legalEntityId: number): Promise<PaginatedResponse<ShopAccount>> {
    const response: AxiosResponse<PaginatedResponse<ShopAccount>> = 
      await this.client.get(`/legal_entities/${legalEntityId}/shop_accounts`);
    return response.data;
  }

  async getShopAccount(id: number): Promise<ShopAccount> {
    const response: AxiosResponse<ShopAccount> = 
      await this.client.get(`/shop_accounts/${id}`);
    return response.data;
  }

  async createShopAccount(data: CreateShopAccountRequest): Promise<ShopAccount> {
    const response: AxiosResponse<ShopAccount> = 
      await this.client.post('/shop_accounts', data);
    return response.data;
  }

  async updateShopAccount(id: number, data: Partial<CreateShopAccountRequest>): Promise<ShopAccount> {
    const response: AxiosResponse<ShopAccount> = 
      await this.client.put(`/shop_accounts/${id}`, data);
    return response.data;
  }

  async deleteShopAccount(id: number): Promise<void> {
    await this.client.delete(`/shop_accounts/${id}`);
  }

  // PEPPOL Lookup - Custom method for PeppolSheet integration
  async lookupPeppolCapability(entityNumber: string): Promise<PeppolLookupResponse> {
    try {
      // This would typically call a PEPPOL directory service
      // For now, we'll implement a basic lookup that could be extended
      const response: AxiosResponse<PeppolLookupResponse> = 
        await this.client.post('/peppol/lookup', { entityNumber });
      return response.data;
    } catch (error) {
      // Return a safe default response
      return {
        has_peppol: false,
        entity_number: entityNumber,
        error: 'PEPPOL lookup service unavailable'
      };
    }
  }

  // Utility methods
  getConfig(): StorecoveConfig {
    return { ...this.config };
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
    this.client.defaults.baseURL = baseUrl;
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }
}
