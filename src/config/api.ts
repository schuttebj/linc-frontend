/**
 * API Configuration for LINC Frontend
 * Handles backend URL configuration and API utilities
 */

// Environment-based API configuration
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }

  // Default to local development backend
  if ((import.meta as any).env?.DEV) {
    return 'http://localhost:8000'; // Local backend development server
  }

  // Production backend URL - working Render deployment
  return 'https://linc-backend-ucer.onrender.com'; // Working Render backend
};

export const API_BASE_URL = getApiBaseUrl();
export const API_VERSION = 'v1';
export const API_ENDPOINTS = {
  // Authentication
  auth: `${API_BASE_URL}/api/${API_VERSION}/auth`,
  
  // Person Management
  persons: `${API_BASE_URL}/api/${API_VERSION}/persons`,
  
  // Specific person endpoints
  personSearch: `${API_BASE_URL}/api/${API_VERSION}/persons/search`,
  personSearchById: (idNumber: string) => `${API_BASE_URL}/api/${API_VERSION}/persons/search/by-id-number/${idNumber}`,
  personCheckExistence: (idType: string, idNumber: string) => `${API_BASE_URL}/api/${API_VERSION}/persons/check-existence/${idType}/${idNumber}`,
  personById: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/persons/${id}`,
  
  // Lookup endpoints
  idDocumentTypes: `${API_BASE_URL}/api/${API_VERSION}/persons/lookups/id-document-types`,
  personNatures: `${API_BASE_URL}/api/${API_VERSION}/persons/lookups/person-natures`,
  addressTypes: `${API_BASE_URL}/api/${API_VERSION}/persons/lookups/address-types`,
  
  // New lookup endpoints
  provinces: `${API_BASE_URL}/api/${API_VERSION}/lookups/provinces`,
  phoneCodes: `${API_BASE_URL}/api/${API_VERSION}/lookups/phone-codes`,
  allLookups: `${API_BASE_URL}/api/${API_VERSION}/lookups/all`,
  validatePhone: `${API_BASE_URL}/api/${API_VERSION}/lookups/validate-phone`,
  validateProvince: `${API_BASE_URL}/api/${API_VERSION}/lookups/validate-province`,
  
  // Location Management endpoints (NEW)
  userGroups: `${API_BASE_URL}/api/${API_VERSION}/user-groups`,
  userGroupById: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/user-groups/${id}`,
  userGroupsByProvince: (provinceCode: string) => `${API_BASE_URL}/api/${API_VERSION}/user-groups/by-province/${provinceCode}`,
  userGroupsStatistics: `${API_BASE_URL}/api/${API_VERSION}/user-groups/statistics`,
  userGroupValidateCode: (code: string) => `${API_BASE_URL}/api/${API_VERSION}/user-groups/validate-code/${code}`,
  
  locations: `${API_BASE_URL}/api/${API_VERSION}/locations`,
  locationById: (id: string) => `${API_BASE_URL}/api/${API_VERSION}/locations/${id}`,
  locationsByUserGroup: (userGroupId: string) => `${API_BASE_URL}/api/${API_VERSION}/locations/by-user-group/${userGroupId}`,
  locationsByProvince: (provinceCode: string) => `${API_BASE_URL}/api/${API_VERSION}/locations/by-province/${provinceCode}`,
  locationsStatistics: `${API_BASE_URL}/api/${API_VERSION}/locations/statistics`,
  locationsNearby: `${API_BASE_URL}/api/${API_VERSION}/locations/nearby`,
} as const;

/**
 * Get auth token from memory (set by AuthContext)
 */
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

/**
 * Default headers for API requests
 */
export const getDefaultHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (includeAuth) {
    // Add authentication header if available (from memory, not localStorage)
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * API request wrapper with error handling
 */
export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getDefaultHeaders(),
        ...options.headers,
      },
    });

    // Handle non-JSON responses (like HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`API returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `API request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Utility functions for common API operations
 */
export const api = {
  // GET request
  get: <T>(url: string): Promise<T> => 
    apiRequest<T>(url, { method: 'GET' }),

  // POST request
  post: <T>(url: string, data?: any): Promise<T> =>
    apiRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // PUT request
  put: <T>(url: string, data?: any): Promise<T> =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // DELETE request
  delete: <T>(url: string): Promise<T> =>
    apiRequest<T>(url, { method: 'DELETE' }),
};

export default api; 