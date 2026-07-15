/**
 * Clinical Trial Matcher API Client
 * 
 * This module provides typed functions to interact with the backend API
 * Deploy your backend first, then update the API_URL below
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nirman-leo9--clinical-trial-api-web.modal.run';

// Types
export interface SearchRequest {
  query: string;
  n_results?: number;
  similarity_threshold?: number;
  patient_id?: string | null;
}

export interface TrialLocation {
  nct_id: string;
  title: string;
  distance_km?: number;
  city: string;
  state: string;
  similarity_score?: number;
}

export interface SearchResponse {
  answer: string;
  sources: Record<string, any>;
  confidence: string;
  total_results: number;
  trial_locations: TrialLocation[];
  processing_time: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  pipeline_ready: boolean;
  stats?: {
    vector_db?: {
      total_count: number;
    };
  };
}

export interface EmbedRequest {
  texts: string[];
}

export interface EmbedResponse {
  embeddings: number[][];
  count: number;
}

export interface BatchMatchRequest {
  patient_ids: string[];
}

export interface BatchMatchResponse {
  status: string;
  job_id: string;
  patient_count: number;
  message: string;
}

// API Client Class
export class ClinicalTrialAPI {
  private baseURL: string;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Check if the API is healthy and ready to serve requests
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Search for clinical trials using natural language query
   */
  async searchTrials(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${this.baseURL}/api/search/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: request.query,
        n_results: request.n_results || 10,
        similarity_threshold: request.similarity_threshold || 0.3,
        patient_id: request.patient_id || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Search failed: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate embeddings for text using GPU-accelerated service
   */
  async generateEmbeddings(texts: string[]): Promise<EmbedResponse> {
    const response = await fetch(`${this.baseURL}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Start a background batch job to match multiple patients
   */
  async batchMatchPatients(patientIds: string[]): Promise<BatchMatchResponse> {
    const response = await fetch(`${this.baseURL}/api/batch/match-patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patient_ids: patientIds }),
    });

    if (!response.ok) {
      throw new Error(`Batch matching failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/stats`);
    
    if (!response.ok) {
      throw new Error(`Stats retrieval failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Clear conversation history
   */
  async clearConversation(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseURL}/api/conversation/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Clear conversation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get details for a specific trial (placeholder)
   */
  async getTrialDetails(nctId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/trials/${nctId}`);
    
    if (!response.ok) {
      throw new Error(`Trial details retrieval failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ClinicalTrialAPI();

// Export individual functions for convenience
export const checkHealth = () => apiClient.checkHealth();
export const searchTrials = (request: SearchRequest) => apiClient.searchTrials(request);
export const generateEmbeddings = (texts: string[]) => apiClient.generateEmbeddings(texts);
export const batchMatchPatients = (patientIds: string[]) => apiClient.batchMatchPatients(patientIds);
export const getStats = () => apiClient.getStats();
export const clearConversation = () => apiClient.clearConversation();
export const getTrialDetails = (nctId: string) => apiClient.getTrialDetails(nctId);
