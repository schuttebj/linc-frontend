/**
 * User Management Service
 * API integration for user management operations
 * Integrates with consolidated User model backend
 */

import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL, getAuthToken } from '../config/api';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
  UserListFilter,
  UserStatistics,

  UserSession,
  CreateUserSessionRequest,
  UserGroup,
  Office,
  Province,
  UserManagementError
} from '../types/user';

// API endpoints
const USER_ENDPOINTS = {
  USERS: '/api/v1/user-management',
  STATISTICS: '/api/v1/user-management/statistics/overview',
  SEARCH: '/api/v1/user-management/search/users',
  VALIDATE_USERNAME: '/api/v1/user-management/validate/username',
  VALIDATE_EMAIL: '/api/v1/user-management/validate/email',
  USER_GROUPS: '/api/v1/user-groups',
  OFFICES: '/api/v1/offices',
  PROVINCES: '/api/v1/lookups/provinces'
} as const;

class UserService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Handle API errors and extract meaningful error messages
   */
  private handleError(error: any): UserManagementError {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      // Handle validation errors with codes (V06001-V06005)
      if (typeof detail === 'object' && detail.errors) {
        return {
          code: 'VALIDATION_ERROR',
          message: detail.errors.join(', '),
          validationCode: detail.errors[0]?.split(':')[0] // Extract V06xxx code
        };
      }
      
      // Handle string error messages
      if (typeof detail === 'string') {
        return {
          code: 'API_ERROR',
          message: detail
        };
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }

  // ========================================
  // USER CRUD OPERATIONS
  // ========================================

  /**
   * Create new user
   * Implements V06001-V06005 validations
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.post(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/`,
        userData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/${userId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(
    page: number = 1,
    size: number = 20,
    filters?: UserListFilter
  ): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });

      // Add filter parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<UserListResponse> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.put(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/${userId}`,
        userData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, softDelete: boolean = true): Promise<User> {
    try {
      const params = new URLSearchParams({
        soft_delete: softDelete.toString()
      });

      const response: AxiosResponse<User> = await axios.delete(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/${userId}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // USER SEARCH AND VALIDATION
  // ========================================

  /**
   * Search users by term
   */
  async searchUsers(searchTerm: string, limit: number = 50): Promise<User[]> {
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      const response: AxiosResponse<User[]> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.SEARCH}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate username availability
   * V06003: User Name must be unique within User Group
   */
  async validateUsername(username: string): Promise<{ available: boolean; message: string }> {
    try {
      const params = new URLSearchParams({ username });
      
      const response: AxiosResponse<{ available: boolean; message: string }> = await axios.post(
        `${this.baseURL}${USER_ENDPOINTS.VALIDATE_USERNAME}?${params.toString()}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate email availability
   * V06004: Email must be valid and unique system-wide
   */
  async validateEmail(email: string): Promise<{ available: boolean; message: string }> {
    try {
      const params = new URLSearchParams({ email });
      
      const response: AxiosResponse<{ available: boolean; message: string }> = await axios.post(
        `${this.baseURL}${USER_ENDPOINTS.VALIDATE_EMAIL}?${params.toString()}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // USER STATISTICS
  // ========================================

  /**
   * Get user management statistics
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response: AxiosResponse<UserStatistics> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.STATISTICS}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Create user session
   */
  async createUserSession(userId: string, sessionData: CreateUserSessionRequest): Promise<UserSession> {
    try {
      const response: AxiosResponse<UserSession> = await axios.post(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/${userId}/sessions`,
        sessionData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string, activeOnly: boolean = true): Promise<UserSession[]> {
    try {
      const params = new URLSearchParams({
        active_only: activeOnly.toString()
      });

      const response: AxiosResponse<UserSession[]> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/${userId}/sessions?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * End user session
   */
  async endUserSession(sessionId: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await axios.delete(
        `${this.baseURL}${USER_ENDPOINTS.USERS}/sessions/${sessionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // LOOKUP DATA
  // ========================================

  /**
   * Get user groups for dropdown
   * V06001: User Group must be active and valid
   */
  async getUserGroups(activeOnly: boolean = true): Promise<UserGroup[]> {
    try {
      const params = new URLSearchParams();
      if (activeOnly) {
        params.append('active_only', 'true');
      }

      const response: AxiosResponse<UserGroup[]> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.USER_GROUPS}?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get offices for a specific user group
   * Note: This endpoint doesn't exist yet in the backend, so we'll return a placeholder
   */
  async getOfficesByUserGroup(userGroupId: string): Promise<Office[]> {
    try {
      // For now, return a placeholder since the offices endpoint doesn't exist yet
      // This would be: `${this.baseURL}/api/v1/user-groups/${userGroupId}/offices`
      
      // Placeholder implementation - return sample offices
      return [
        {
          id: 'office-a',
          officeCode: 'A',
          name: 'Main Office',
          userGroupId: userGroupId,
          isActive: true
        },
        {
          id: 'office-b', 
          officeCode: 'B',
          name: 'Branch Office',
          userGroupId: userGroupId,
          isActive: true
        }
      ];
    } catch (error) {
      console.warn('Offices endpoint not implemented yet, using placeholder data');
      return [];
    }
  }

  /**
   * Get provinces for dropdown
   */
  async getProvinces(): Promise<Province[]> {
    try {
      const response: AxiosResponse<Province[]> = await axios.get(
        `${this.baseURL}${USER_ENDPOINTS.PROVINCES}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Validate ID number based on type
   * V06005: ID Number must be valid for selected ID Type
   */
  validateIdNumber(idType: string, idNumber: string): { isValid: boolean; message: string } {
    if (!idNumber || !idType) {
      return { isValid: false, message: 'ID number and type are required' };
    }

    switch (idType) {
      case '02': // RSA ID
        if (!/^\d{13}$/.test(idNumber)) {
          return { isValid: false, message: 'RSA ID must be 13 digits' };
        }
        if (!this.validateRSAIdCheckDigit(idNumber)) {
          return { isValid: false, message: 'Invalid RSA ID check digit' };
        }
        return { isValid: true, message: 'Valid RSA ID' };

      case '04': // Passport
        if (idNumber.length < 4 || idNumber.length > 20) {
          return { isValid: false, message: 'Passport must be 4-20 characters' };
        }
        if (!/^[A-Za-z0-9]+$/.test(idNumber)) {
          return { isValid: false, message: 'Passport can only contain letters and numbers' };
        }
        return { isValid: true, message: 'Valid passport number' };

      case '03': // Foreign ID
        if (idNumber.length < 5 || idNumber.length > 25) {
          return { isValid: false, message: 'Foreign ID must be 5-25 characters' };
        }
        return { isValid: true, message: 'Valid foreign ID' };

      default:
        return { isValid: true, message: 'Valid ID number' };
    }
  }

  /**
   * Validate RSA ID check digit using Luhn algorithm
   */
  private validateRSAIdCheckDigit(idNumber: string): boolean {
    if (idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
      return false;
    }

    const digits = idNumber.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        sum += digits[i];
      } else {
        const doubled = digits[i] * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      }
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }

  /**
   * Format user display name
   */
  formatUserDisplayName(user: User): string {
    if (user.userName) {
      return user.userName;
    }
    if (user.personalDetails?.fullName) {
      return user.personalDetails.fullName;
    }
    return user.username;
  }

  /**
   * Get user authority level display
   */
  getAuthorityLevelDisplay(level: string): string {
    const displays = {
      NATIONAL: 'National Level',
      PROVINCIAL: 'Provincial Level',
      REGIONAL: 'Regional Level',
      LOCAL: 'Local Level',
      OFFICE: 'Office Level',
      PERSONAL: 'Personal Level'
    };
    return displays[level as keyof typeof displays] || level;
  }

  /**
   * Get user status color for UI
   */
  getUserStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_ACTIVATION':
        return 'warning';
      case 'SUSPENDED':
      case 'LOCKED':
        return 'error';
      case 'INACTIVE':
        return 'info';
      default:
        return 'info';
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService; 