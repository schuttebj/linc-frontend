/**
 * Lookup Service for LINC Frontend
 * Handles fetching dropdown data from backend API
 */

import { api, API_ENDPOINTS } from './api';

// Types for lookup data
export interface Province {
  code: string;
  name: string;
}

export interface PhoneCode {
  country_code: string;
  country_name: string;
  phone_code: string;
}

export interface LookupData {
  provinces: Province[];
  phone_codes: PhoneCode[];
}

export interface PhoneValidationRequest {
  country_code: string;
  phone_number: string;
}

export interface PhoneValidationResponse {
  is_valid: boolean;
  formatted_number?: string;
  error_message?: string;
}

export interface ProvinceValidationRequest {
  province_code: string;
}

export interface ProvinceValidationResponse {
  is_valid: boolean;
  province_name?: string;
  error_message?: string;
}

/**
 * Lookup Service Class
 */
class LookupService {
  private static instance: LookupService;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): LookupService {
    if (!LookupService.instance) {
      LookupService.instance = new LookupService();
    }
    return LookupService.instance;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Set cache with expiry
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get provinces list
   */
  public async getProvinces(): Promise<Province[]> {
    const cacheKey = 'provinces';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const provinces = await api.get<Province[]>(API_ENDPOINTS.provinces);
      this.setCache(cacheKey, provinces);
      return provinces;
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      // Return fallback data
      return [
        { code: 'EC', name: 'Eastern Cape' },
        { code: 'FS', name: 'Free State' },
        { code: 'GP', name: 'Gauteng' },
        { code: 'KZN', name: 'KwaZulu-Natal' },
        { code: 'LP', name: 'Limpopo' },
        { code: 'MP', name: 'Mpumalanga' },
        { code: 'NC', name: 'Northern Cape' },
        { code: 'NW', name: 'North West' },
        { code: 'WC', name: 'Western Cape' }
      ];
    }
  }

  /**
   * Get phone codes list
   */
  public async getPhoneCodes(): Promise<PhoneCode[]> {
    const cacheKey = 'phone_codes';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const phoneCodes = await api.get<PhoneCode[]>(API_ENDPOINTS.phoneCodes);
      this.setCache(cacheKey, phoneCodes);
      return phoneCodes;
    } catch (error) {
      console.error('Failed to fetch phone codes:', error);
      // Return fallback data
      return [
        { country_code: 'ZA', country_name: 'South Africa', phone_code: '+27' },
        { country_code: 'US', country_name: 'United States', phone_code: '+1' },
        { country_code: 'GB', country_name: 'United Kingdom', phone_code: '+44' },
        { country_code: 'IN', country_name: 'India', phone_code: '+91' },
        { country_code: 'CN', country_name: 'China', phone_code: '+86' },
        { country_code: 'FR', country_name: 'France', phone_code: '+33' },
        { country_code: 'DE', country_name: 'Germany', phone_code: '+49' },
        { country_code: 'AU', country_name: 'Australia', phone_code: '+61' },
        { country_code: 'CA', country_name: 'Canada', phone_code: '+1' },
        { country_code: 'BR', country_name: 'Brazil', phone_code: '+55' }
      ];
    }
  }

  /**
   * Get all lookup data at once
   */
  public async getAllLookups(): Promise<LookupData> {
    const cacheKey = 'all_lookups';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const lookupData = await api.get<LookupData>(API_ENDPOINTS.allLookups);
      this.setCache(cacheKey, lookupData);
      return lookupData;
    } catch (error) {
      console.error('Failed to fetch all lookups:', error);
      // Fallback to individual calls
      const [provinces, phone_codes] = await Promise.all([
        this.getProvinces(),
        this.getPhoneCodes()
      ]);
      return { provinces, phone_codes };
    }
  }

  /**
   * Validate phone number
   */
  public async validatePhone(request: PhoneValidationRequest): Promise<PhoneValidationResponse> {
    try {
      return await api.post<PhoneValidationResponse>(API_ENDPOINTS.validatePhone, request);
    } catch (error) {
      console.error('Failed to validate phone:', error);
      return {
        is_valid: false,
        error_message: 'Validation service unavailable'
      };
    }
  }

  /**
   * Validate province
   */
  public async validateProvince(request: ProvinceValidationRequest): Promise<ProvinceValidationResponse> {
    try {
      return await api.post<ProvinceValidationResponse>(API_ENDPOINTS.validateProvince, request);
    } catch (error) {
      console.error('Failed to validate province:', error);
      return {
        is_valid: false,
        error_message: 'Validation service unavailable'
      };
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Format phone number for display
   */
  public formatPhoneNumber(countryCode: string, phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Format based on country
    if (countryCode === '+27' && cleanNumber.length === 9) {
      // South African format: +27 XX XXX XXXX
      return `${countryCode} ${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 5)} ${cleanNumber.substring(5)}`;
    } else if (countryCode === '+1' && cleanNumber.length === 10) {
      // US/Canada format: +1 (XXX) XXX-XXXX
      return `${countryCode} (${cleanNumber.substring(0, 3)}) ${cleanNumber.substring(3, 6)}-${cleanNumber.substring(6)}`;
    } else if (countryCode === '+44' && cleanNumber.length >= 10) {
      // UK format: +44 XXXX XXXXXX
      return `${countryCode} ${cleanNumber.substring(0, 4)} ${cleanNumber.substring(4)}`;
    }
    
    // Default format
    return `${countryCode} ${cleanNumber}`;
  }
}

// Export singleton instance
export const lookupService = LookupService.getInstance();
export default lookupService; 