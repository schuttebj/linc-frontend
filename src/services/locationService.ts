/**
 * Location Management API Service
 * Handles all API communication for location management functionality
 */

import { API_ENDPOINTS, api } from '../config/api';
import {
  UserGroup,
  UserGroupCreate,
  UserGroupUpdate,
  UserGroupListFilter,
  UserGroupStatistics,
  Location,
  LocationCreate,
  LocationUpdate,
  LocationListFilter,
  LocationStatistics,
  LocationResource,
  UserLocationAssignment,
  PaginatedResponse
} from '../types/location';

/**
 * User Group API Services
 */
export const userGroupService = {
  // Create user group
  create: async (data: UserGroupCreate): Promise<UserGroup> => {
    return api.post<UserGroup>(API_ENDPOINTS.userGroups, data);
  },

  // Get all user groups with filtering
  getAll: async (
    filters?: UserGroupListFilter,
    page = 1,
    size = 50
  ): Promise<UserGroup[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    params.append('skip', String((page - 1) * size));
    params.append('limit', String(size));
    
    const url = `${API_ENDPOINTS.userGroups}?${params.toString()}`;
    return api.get<UserGroup[]>(url);
  },

  // Get user group by ID
  getById: async (id: string): Promise<UserGroup> => {
    return api.get<UserGroup>(API_ENDPOINTS.userGroupById(id));
  },

  // Update user group
  update: async (id: string, data: UserGroupUpdate): Promise<UserGroup> => {
    return api.put<UserGroup>(API_ENDPOINTS.userGroupById(id), data);
  },

  // Delete user group (soft delete)
  delete: async (id: string): Promise<UserGroup> => {
    return api.delete<UserGroup>(API_ENDPOINTS.userGroupById(id));
  },

  // Get user groups by province
  getByProvince: async (provinceCode: string): Promise<UserGroup[]> => {
    return api.get<UserGroup[]>(API_ENDPOINTS.userGroupsByProvince(provinceCode));
  },

  // Get DLTC user groups
  getDLTCGroups: async (): Promise<UserGroup[]> => {
    return api.get<UserGroup[]>(`${API_ENDPOINTS.userGroups}/type/dltc`);
  },

  // Get help desk user groups
  getHelpDeskGroups: async (): Promise<UserGroup[]> => {
    return api.get<UserGroup[]>(`${API_ENDPOINTS.userGroups}/type/help-desk`);
  },

  // Get user group statistics
  getStatistics: async (): Promise<UserGroupStatistics> => {
    return api.get<UserGroupStatistics>(API_ENDPOINTS.userGroupsStatistics);
  },

  // Validate user group code
  validateCode: async (code: string): Promise<{ is_available: boolean; message: string }> => {
    return api.get<{ is_available: boolean; message: string }>(
      API_ENDPOINTS.userGroupValidateCode(code)
    );
  }
};

/**
 * Location API Services
 */
export const locationService = {
  // Create location
  create: async (data: LocationCreate): Promise<Location> => {
    return api.post<Location>(API_ENDPOINTS.locations, data);
  },

  // Get all locations with filtering
  getAll: async (
    filters?: LocationListFilter,
    page = 1,
    size = 50
  ): Promise<Location[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    params.append('skip', String((page - 1) * size));
    params.append('limit', String(size));
    
    const url = `${API_ENDPOINTS.locations}?${params.toString()}`;
    return api.get<Location[]>(url);
  },

  // Get location by ID
  getById: async (id: string): Promise<Location> => {
    return api.get<Location>(API_ENDPOINTS.locationById(id));
  },

  // Update location
  update: async (id: string, data: LocationUpdate): Promise<Location> => {
    return api.put<Location>(API_ENDPOINTS.locationById(id), data);
  },

  // Delete location (soft delete)
  delete: async (id: string): Promise<Location> => {
    return api.delete<Location>(API_ENDPOINTS.locationById(id));
  },

  // Get locations by user group
  getByUserGroup: async (userGroupId: string): Promise<Location[]> => {
    return api.get<Location[]>(API_ENDPOINTS.locationsByUserGroup(userGroupId));
  },

  // Get locations by province
  getByProvince: async (provinceCode: string): Promise<Location[]> => {
    return api.get<Location[]>(API_ENDPOINTS.locationsByProvince(provinceCode));
  },

  // Get location statistics
  getStatistics: async (): Promise<LocationStatistics> => {
    return api.get<LocationStatistics>(API_ENDPOINTS.locationsStatistics);
  },

  // Find nearby locations
  findNearby: async (
    latitude: number,
    longitude: number,
    radiusKm = 50
  ): Promise<Location[]> => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius_km: String(radiusKm)
    });
    
    return api.get<Location[]>(`${API_ENDPOINTS.locationsNearby}?${params.toString()}`);
  }
};

/**
 * Location Resource API Services
 */
export const locationResourceService = {
  // Get resources for a location
  getByLocation: async (locationId: string): Promise<LocationResource[]> => {
    return api.get<LocationResource[]>(`${API_ENDPOINTS.locations}/${locationId}/resources`);
  },

  // Create resource
  create: async (locationId: string, data: Omit<LocationResource, 'id' | 'location_id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<LocationResource> => {
    return api.post<LocationResource>(`${API_ENDPOINTS.locations}/${locationId}/resources`, data);
  },

  // Update resource
  update: async (locationId: string, resourceId: string, data: Partial<LocationResource>): Promise<LocationResource> => {
    return api.put<LocationResource>(`${API_ENDPOINTS.locations}/${locationId}/resources/${resourceId}`, data);
  },

  // Delete resource
  delete: async (locationId: string, resourceId: string): Promise<void> => {
    return api.delete<void>(`${API_ENDPOINTS.locations}/${locationId}/resources/${resourceId}`);
  }
};

/**
 * User Location Assignment API Services
 */
export const userLocationAssignmentService = {
  // Get assignments for a location
  getByLocation: async (locationId: string): Promise<UserLocationAssignment[]> => {
    return api.get<UserLocationAssignment[]>(`${API_ENDPOINTS.locations}/${locationId}/assignments`);
  },

  // Get assignments for a user
  getByUser: async (userId: string): Promise<UserLocationAssignment[]> => {
    return api.get<UserLocationAssignment[]>(`/api/v1/users/${userId}/location-assignments`);
  },

  // Create assignment
  create: async (data: Omit<UserLocationAssignment, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<UserLocationAssignment> => {
    return api.post<UserLocationAssignment>('/api/v1/user-location-assignments', data);
  },

  // Update assignment
  update: async (assignmentId: string, data: Partial<UserLocationAssignment>): Promise<UserLocationAssignment> => {
    return api.put<UserLocationAssignment>(`/api/v1/user-location-assignments/${assignmentId}`, data);
  },

  // Delete assignment
  delete: async (assignmentId: string): Promise<void> => {
    return api.delete<void>(`/api/v1/user-location-assignments/${assignmentId}`);
  }
};

/**
 * Combined service export
 */
export const locationAPI = {
  userGroups: userGroupService,
  locations: locationService,
  resources: locationResourceService,
  assignments: userLocationAssignmentService
};

export default locationAPI; 