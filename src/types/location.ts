/**
 * Location Management Type Definitions
 * Matches backend schemas for location management functionality
 */

// Enums matching backend
export enum UserGroupType {
  FIXED_DLTC = 'fixed_dltc',
  MOBILE_DLTC = 'mobile_dltc',
  REGIONAL_AUTHORITY = 'regional_authority', 
  PLAMARK = 'plamark',
  NHELPDESK = 'nhelpdesk'
}

export enum RegistrationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum OfficeType {
  PRIMARY = 'primary',
  BRANCH = 'branch',
  MOBILE = 'mobile',
  SUPPORT = 'support'
}

export enum InfrastructureType {
  FIXED_DLTC = 'fixed_dltc',
  MOBILE_DLTC = 'mobile_dltc',
  REGIONAL_AUTHORITY = 'regional_authority',
  PLAMARK = 'plamark',
  NHELPDESK = 'nhelpdesk'
}

export enum OperationalStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended'
}

export enum LocationScope {
  NATIONAL = 'national',
  PROVINCIAL = 'provincial'
}

export enum ResourceType {
  PRINTER = 'printer',
  COMPUTER = 'computer', 
  TESTING_EQUIPMENT = 'testing_equipment',
  VEHICLE = 'vehicle',
  OTHER = 'other'
}

export enum ResourceStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order'
}

export enum AssignmentType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TEMPORARY = 'temporary'
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Base interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_active: boolean;
}

// Address interface (matches backend)
export interface Address {
  id?: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
  postal_code?: string;
  city?: string;
  province_code: string;
  country_code: string;
  address_type?: string;
}

// User Group interfaces
export interface UserGroup extends BaseEntity {
  user_group_code: string;
  user_group_name: string;
  user_group_type: UserGroupType;
  infrastructure_type_code: number;
  province_code: string;
  province_name?: string;
  registration_status: RegistrationStatus;
  parent_user_group_id?: string;
  parent_user_group?: UserGroup;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  address?: Address;
  
  // Statistics
  office_count?: number;
  location_count?: number;
  user_count?: number;
}

export interface UserGroupCreate {
  user_group_code: string;
  user_group_name: string;
  user_group_type: UserGroupType;
  infrastructure_type_code: number;
  province_code: string;
  registration_status?: RegistrationStatus;
  parent_user_group_id?: string;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  address?: Omit<Address, 'id'>;
}

export interface UserGroupUpdate {
  user_group_name?: string;
  user_group_type?: UserGroupType;
  infrastructure_type_code?: number;
  registration_status?: RegistrationStatus;
  parent_user_group_id?: string;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  address?: Omit<Address, 'id'>;
  is_active?: boolean;
}

// Office interfaces
export interface Office extends BaseEntity {
  office_code: string;
  office_name: string;
  office_type: OfficeType;
  user_group_id: string;
  user_group?: UserGroup;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  
  // Capacity management
  max_users?: number;
  current_users?: number;
  max_daily_applications?: number;
  
  // Statistics
  location_count?: number;
  user_count?: number;
}

// Location interfaces  
export interface Location extends BaseEntity {
  location_name: string;
  location_code?: string;
  user_group_id: string;
  user_group?: UserGroup;
  office_id?: string;
  office?: Office;
  infrastructure_type: InfrastructureType;
  operational_status: OperationalStatus;
  location_scope: LocationScope;
  
  // Address information
  address: Address;
  
  // Geographic coordinates
  latitude?: number;
  longitude?: number;
  
  // Contact information
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  
  // Capacity management
  max_users?: number;
  current_users?: number;
  max_daily_capacity?: number;
  current_load?: number;
  
  // Service configuration
  services_offered?: string[];
  operating_hours?: string;
  appointment_required?: boolean;
  
  // Printing configuration
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
  
  // Statistics
  resource_count?: number;
  user_assignment_count?: number;
}

export interface LocationCreate {
  location_name: string;
  location_code?: string;
  user_group_id: string;
  office_id?: string;
  infrastructure_type: InfrastructureType;
  operational_status?: OperationalStatus;
  location_scope?: LocationScope;
  address: Omit<Address, 'id'>;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  max_users?: number;
  max_daily_capacity?: number;
  services_offered?: string[];
  operating_hours?: string;
  appointment_required?: boolean;
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
}

export interface LocationUpdate {
  location_name?: string;
  location_code?: string;
  office_id?: string;
  infrastructure_type?: InfrastructureType;
  operational_status?: OperationalStatus;
  location_scope?: LocationScope;
  address?: Omit<Address, 'id'>;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  phone_number?: string;
  email_address?: string;
  max_users?: number;
  max_daily_capacity?: number;
  services_offered?: string[];
  operating_hours?: string;
  appointment_required?: boolean;
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
  is_active?: boolean;
}

// Resource interfaces
export interface LocationResource extends BaseEntity {
  resource_name: string;
  resource_type: ResourceType;
  location_id: string;
  location?: Location;
  subtype?: string;
  manufacturer?: string;
  part_number?: string;
  serial_number?: string;
  specifications?: string;
  status: ResourceStatus;
  capacity?: number;
  current_utilization?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

// User Assignment interfaces
export interface UserLocationAssignment extends BaseEntity {
  user_id: string;
  location_id: string;
  location?: Location;
  assignment_type: AssignmentType;
  assignment_status: AssignmentStatus;
  start_date: string;
  end_date?: string;
  notes?: string;
  
  // User information (populated by backend)
  user_username?: string;
  user_full_name?: string;
  user_email?: string;
}

// Filter and statistics interfaces
export interface UserGroupListFilter {
  province_code?: string;
  user_group_type?: UserGroupType;
  registration_status?: RegistrationStatus;
  is_active?: boolean;
  search?: string;
}

export interface LocationListFilter {
  user_group_id?: string;
  province_code?: string;
  infrastructure_type?: InfrastructureType;
  operational_status?: OperationalStatus;
  location_scope?: LocationScope;
  is_active?: boolean;
  search?: string;
}

export interface UserGroupStatistics {
  total_user_groups: number;
  by_province: Record<string, number>;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  active_count: number;
  inactive_count: number;
}

export interface LocationStatistics {
  total_locations: number;
  by_province: Record<string, number>;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  active_count: number;
  inactive_count: number;
  total_capacity: number;
  total_current_load: number;
  capacity_utilization: number;
}

// Form data interfaces for UI
export interface UserGroupFormData extends UserGroupCreate {}
export interface LocationFormData extends LocationCreate {}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  validation_code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
} 