/**
 * Location Management Type Definitions
 * Matches backend schemas for location management functionality
 */

// Enums matching backend
export enum UserGroupType {
  FIXED_DLTC = '10',
  MOBILE_DLTC = '11',
  PRINTING_CENTER = '12',
  REGISTERING_AUTHORITY = '20',
  PROVINCIAL_HELP_DESK = '30',
  NATIONAL_HELP_DESK = '31',
  VEHICLE_TESTING_STATION = '40',
  ADMIN_OFFICE = '50'
}

export enum RegistrationStatus {
  PENDING_REGISTRATION = '1',
  REGISTERED = '2',
  SUSPENDED = '3',
  PENDING_RENEWAL = '4',
  CANCELLED = '5',
  PENDING_INSPECTION = '6',
  INSPECTION_FAILED = '7',
  DEREGISTERED = '8'
}

export enum OfficeType {
  PRIMARY = 'primary',
  BRANCH = 'branch',
  SPECIALIZED = 'specialized',
  MOBILE = 'mobile',
  SUPPORT = 'support'
}

export enum InfrastructureType {
  FIXED_DLTC = '10',
  MOBILE_DLTC = '11',
  PRINTING_CENTER = '12',
  COMBINED_CENTER = '13',
  ADMIN_OFFICE = '14',
  REGISTERING_AUTHORITY = '20',
  PROVINCIAL_OFFICE = '30',
  NATIONAL_OFFICE = '31',
  VEHICLE_TESTING = '40',
  HELP_DESK = '50'
}

export enum OperationalStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended',
  SETUP = 'setup',
  DECOMMISSIONED = 'decommissioned',
  INSPECTION = 'inspection'
}

export enum LocationScope {
  NATIONAL = 'national',
  PROVINCIAL = 'provincial',
  REGIONAL = 'regional',
  LOCAL = 'local'
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
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TEMPORARY = 'TEMPORARY',
  BACKUP = 'BACKUP',
  TRAINING = 'TRAINING',
  SUPERVISION = 'SUPERVISION',
  MAINTENANCE = 'MAINTENANCE'
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED'
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
  infrastructure_type_code?: number; // Legacy field
  province_code: string;
  province_name?: string;
  registration_status: RegistrationStatus;
  parent_group_id?: string;
  parent_user_group?: UserGroup;
  suspended_until?: string;
  contact_person?: string;
  contact_user_id?: string;
  phone_number?: string;
  email?: string;
  operational_notes?: string;
  service_area_description?: string;
  
  // System variables from backend
  is_provincial_help_desk: boolean;
  is_national_help_desk: boolean;
  
  // Computed properties from backend
  authority_level: string;
  is_dltc: boolean;
  can_access_all_provinces: boolean;
  can_access_province_data: boolean;
  
  // Legacy compatibility
  description?: string;
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
  province_code: string;
  parent_group_id?: string;
  is_provincial_help_desk?: boolean;
  is_national_help_desk?: boolean;
  registration_status?: RegistrationStatus;
  suspended_until?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  operational_notes?: string;
  service_area_description?: string;
  is_active?: boolean;
  
  // Legacy compatibility
  infrastructure_type_code?: number;
  description?: string;
  email_address?: string;
  address?: Omit<Address, 'id'>;
}

export interface UserGroupUpdate {
  user_group_name?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  operational_notes?: string;
  service_area_description?: string;
  registration_status?: RegistrationStatus;
  suspended_until?: string;
  is_active?: boolean;
  
  // Legacy compatibility
  user_group_type?: UserGroupType;
  infrastructure_type_code?: number;
  parent_user_group_id?: string;
  description?: string;
  email_address?: string;
  address?: Omit<Address, 'id'>;
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
  email?: string;
  daily_capacity?: number;
  staff_count?: number;
  is_operational: boolean;
  operating_hours?: string;
  service_types?: string;
  
  // Computed properties from backend
  full_office_code: string;
  is_primary_office: boolean;
  is_mobile_unit: boolean;
  
  // Statistics
  location_count?: number;
  user_count?: number;
}

export interface OfficeCreate {
  office_code: string;
  office_name: string;
  user_group_id: string;
  office_type?: OfficeType;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  daily_capacity?: number;
  staff_count?: number;
  is_active?: boolean;
  is_operational?: boolean;
  operating_hours?: string;
  service_types?: string;
}

export interface OfficeUpdate {
  office_name?: string;
  office_type?: OfficeType;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  daily_capacity?: number;
  staff_count?: number;
  is_active?: boolean;
  is_operational?: boolean;
  operating_hours?: string;
  service_types?: string;
}

// Location interfaces  
export interface Location extends BaseEntity {
  location_name: string;
  location_code: string;
  user_group_id: string;
  user_group?: UserGroup;
  office_id?: string;
  office?: Office;
  infrastructure_type: InfrastructureType;
  operational_status: OperationalStatus;
  location_scope: LocationScope;
  
  // Address information (flattened from backend)
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  city: string;
  province_code: string;
  postal_code?: string;
  country_code: string;
  
  // Geographic coordinates
  latitude?: number;
  longitude?: number;
  
  // Contact information
  contact_person?: string;
  contact_user_id?: string;
  phone_number?: string;
  fax_number?: string;
  email?: string;
  email_address?: string;
  
  // Capacity management
  daily_capacity?: number;
  current_load?: number;
  max_concurrent_operations?: number;
  
  // Service configuration
  services_offered?: string[];
  operating_hours?: any;
  special_hours?: any;
  
  // Facility details
  facility_description?: string;
  accessibility_features?: string[];
  parking_availability?: boolean;
  public_transport_access?: string;
  operational_notes?: string;
  public_instructions?: string;
  
  // Status flags
  is_public: boolean;
  requires_appointment: boolean;
  
  // Computed properties from backend
  full_address: string;
  is_dltc: boolean;
  is_printing_facility: boolean;
  available_capacity: number;
  capacity_utilization: number;
  is_operational: boolean;
  
  // Legacy compatibility
  address?: Address;
  max_users?: number;
  current_users?: number;
  max_daily_capacity?: number;
  email_address?: string;
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
  appointment_required?: boolean;
  
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
  
  // Address information (can be flat or nested)
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  city?: string;
  province_code?: string;
  postal_code?: string;
  country_code?: string;
  address?: Omit<Address, 'id'>; // Alternative nested format
  
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  phone_number?: string;
  fax_number?: string;
  email?: string;
  daily_capacity?: number;
  current_load?: number;
  max_concurrent_operations?: number;
  services_offered?: string[];
  operating_hours?: any;
  special_hours?: any;
  facility_description?: string;
  accessibility_features?: string[];
  parking_availability?: boolean;
  public_transport_access?: string;
  operational_notes?: string;
  public_instructions?: string;
  is_active?: boolean;
  is_public?: boolean;
  requires_appointment?: boolean;
  
  // Legacy compatibility
  max_users?: number;
  max_daily_capacity?: number;
  email_address?: string;
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
  appointment_required?: boolean;
}

export interface LocationUpdate {
  location_name?: string;
  location_code?: string;
  office_id?: string;
  infrastructure_type?: InfrastructureType;
  operational_status?: OperationalStatus;
  location_scope?: LocationScope;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  phone_number?: string;
  fax_number?: string;
  email?: string;
  daily_capacity?: number;
  current_load?: number;
  max_concurrent_operations?: number;
  services_offered?: string[];
  operating_hours?: any;
  special_hours?: any;
  facility_description?: string;
  accessibility_features?: string[];
  parking_availability?: boolean;
  public_transport_access?: string;
  operational_notes?: string;
  public_instructions?: string;
  is_active?: boolean;
  is_public?: boolean;
  requires_appointment?: boolean;
  
  // Legacy compatibility
  address?: Omit<Address, 'id'>;
  max_users?: number;
  max_daily_capacity?: number;
  email_address?: string;
  has_centralized_printing?: boolean;
  has_onsite_printing?: boolean;
  printer_count?: number;
  appointment_required?: boolean;
}

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

// Enhanced User Location Assignment interface (matches backend)
export interface UserLocationAssignment extends BaseEntity {
  user_id: string;
  location_id: string;
  location?: Location;
  office_id?: string;
  office?: Office;
  
  // Assignment classification
  assignment_type: AssignmentType;
  assignment_status: AssignmentStatus;
  
  // Assignment validity
  effective_date: string;
  expiry_date?: string;
  
  // Access and permissions (NEW - from enhanced backend)
  access_level: string;
  can_manage_location: boolean;
  can_assign_others: boolean;
  can_view_reports: boolean;
  can_manage_resources: boolean;
  
  // Operational details
  work_schedule?: string;
  responsibilities?: string;
  
  // Assignment context
  assigned_by?: string;
  assignment_reason?: string;
  notes?: string;
  
  // Activity tracking (NEW - from enhanced backend)
  last_activity_date?: string;
  total_hours_worked: number;
  
  // Computed properties from backend
  is_valid_assignment: boolean;
  is_primary_assignment: boolean;
  is_temporary_assignment: boolean;
  days_until_expiry: number;
  assignment_duration_days: number;
  
  // Legacy compatibility
  start_date?: string;
  end_date?: string;
  
  // User information (populated by backend)
  user_username?: string;
  user_full_name?: string;
  user_email?: string;
}

// Create and Update interfaces for staff assignments
export interface StaffAssignmentCreate {
  user_id: string;
  assignment_type: AssignmentType;
  assignment_status?: AssignmentStatus;
  effective_date: string;
  expiry_date?: string;
  access_level?: string;
  can_manage_location?: boolean;
  can_assign_others?: boolean;
  can_view_reports?: boolean;
  can_manage_resources?: boolean;
  work_schedule?: string;
  responsibilities?: string;
  assignment_reason?: string;
  notes?: string;
  is_active?: boolean;
}

export interface StaffAssignmentUpdate {
  assignment_type?: AssignmentType;
  assignment_status?: AssignmentStatus;
  effective_date?: string;
  expiry_date?: string;
  access_level?: string;
  can_manage_location?: boolean;
  can_assign_others?: boolean;
  can_view_reports?: boolean;
  can_manage_resources?: boolean;
  work_schedule?: string;
  responsibilities?: string;
  assignment_reason?: string;
  notes?: string;
  is_active?: boolean;
}

// Filter interfaces
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

// Form data interfaces
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