/**
 * User Management Types
 * TypeScript interfaces matching the backend UserProfile schemas
 * Consolidated to work with the existing User model
 */

export interface User {
  id: string;
  username: string;
  userGroupCode: string;
  officeCode: string;
  userName: string;
  userTypeCode: string;
  
  // Personal details (support both camelCase and snake_case)
  personalDetails?: PersonalDetails;
  personal_details?: PersonalDetailsSnakeCase;
  
  // Geographic assignment
  geographicAssignment: GeographicAssignment;
  
  // Job details
  employeeId?: string;
  department?: string;
  jobTitle?: string;
  infrastructureNumber?: string;
  
  // Status
  status: UserStatus;
  isActive: boolean;
  isSuperuser: boolean;
  isVerified: boolean;
  
  // Authority level
  authorityLevel: AuthorityLevel;
  
  // Relationships
  userGroup?: UserGroupInfo;
  office?: OfficeInfo;
  roles: Role[];
  permissions: string[];
  locationAssignments: LocationAssignment[];
  
  // System settings
  language: string;
  timezone: string;
  dateFormat: string;
  
  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastLoginAt?: string;
}

export interface PersonalDetails {
  idType: IDType;
  idNumber: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  alternativePhone?: string;
}

export interface PersonalDetailsSnakeCase {
  id_type: string;
  id_number: string;
  full_name: string;
  email: string;
  phone_number?: string;
  alternative_phone?: string;
}

export interface GeographicAssignment {
  countryCode: string;
  provinceCode: string;
  region?: string;
}

export interface UserGroupInfo {
  id: string;
  name: string;
}

export interface OfficeInfo {
  code: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface LocationAssignment {
  id: string;
  name: string;
}

// Enums matching backend
export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  INACTIVE = "INACTIVE",
  LOCKED = "LOCKED",
  PENDING_ACTIVATION = "PENDING_ACTIVATION"
}

export enum UserType {
  STANDARD = "1",
  SYSTEM = "2",
  EXAMINER = "3",
  SUPERVISOR = "4",
  ADMIN = "5"
}

export enum IDType {
  TRN = "01",
  SA_ID = "02",
  FOREIGN_ID = "03",
  PASSPORT = "04",
  OTHER = "97"
}

export enum AuthorityLevel {
  NATIONAL = "NATIONAL",
  PROVINCIAL = "PROVINCIAL",
  REGIONAL = "REGIONAL",
  LOCAL = "LOCAL",
  OFFICE = "OFFICE",
  PERSONAL = "PERSONAL"
}

// Create/Update request interfaces
export interface CreateUserRequest {
  // Core identification (snake_case to match backend)
  user_group_code: string;
  office_code: string;
  user_name: string;
  user_type_code: UserType;
  
  // Authentication
  username: string;
  password: string;
  
  // Personal details (snake_case to match backend)
  personal_details: {
    id_type: IDType;
    id_number: string;
    full_name: string;
    email: string;
    phone_number?: string;
    alternative_phone?: string;
  };
  
  // Geographic assignment (snake_case to match backend)
  geographic_assignment: {
    country_code: string;
    province_code: string;
    region?: string;
  };
  
  // Job details (snake_case to match backend)
  employee_id?: string;
  department?: string;
  job_title?: string;
  infrastructure_number?: string;
  
  // Status (snake_case to match backend)
  status: UserStatus;
  is_active: boolean;
  
  // Role assignments (snake_case to match backend)
  role_ids: string[];
  permission_ids: string[];
  
  // Security (snake_case to match backend)
  require_password_change: boolean;
  require_2fa: boolean;
  
  // System settings (snake_case to match backend)
  language: string;
  timezone: string;
  date_format: string;
}

export interface UpdateUserRequest {
  // Personal details
  personalDetails?: Partial<PersonalDetails>;
  
  // Job details
  employeeId?: string;
  department?: string;
  jobTitle?: string;
  
  // Geographic assignment (restricted)
  provinceCode?: string;
  region?: string;
  
  // User group assignment (restricted)
  userGroupCode?: string;
  officeCode?: string;
  
  // Infrastructure assignment
  infrastructureNumber?: string;
  
  // System settings
  language?: string;
  timezone?: string;
  dateFormat?: string;
  
  // Status (restricted)
  status?: UserStatus;
  isActive?: boolean;
  
  // Role assignments (restricted)
  roleIds?: string[];
  permissionIds?: string[];
}

// List/Filter interfaces
export interface UserListFilter {
  // Status filters
  status?: UserStatus;
  isActive?: boolean;
  userType?: UserType;
  
  // Geographic filters
  provinceCode?: string;
  userGroupCode?: string;
  officeCode?: string;
  
  // Role filters
  roleName?: string;
  authorityLevel?: AuthorityLevel;
  
  // Department filters
  department?: string;
  
  // Search
  search?: string;
  
  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingActivation: number;
  
  // By type
  byUserType: Record<string, number>;
  byProvince: Record<string, number>;
  byUserGroup: Record<string, number>;
  byAuthorityLevel: Record<string, number>;
  
  // Recent activity
  newUsersThisMonth: number;
  activeSessions: number;
  recentLogins: number;
}

// Validation interfaces
export interface UserValidationResult {
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  businessRuleViolations: string[];
  
  // Specific validation checks (V06001-V06005)
  userGroupValid: boolean;
  officeValid: boolean;
  userNameUnique: boolean;
  emailUnique: boolean;
  idNumberValid: boolean;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  permissionName: string;
  userId: string;
  reason?: string;
  authorityLevel: AuthorityLevel;
  applicableConstraints: string[];
}

// Session management
export interface UserSession {
  id: string;
  userId: string;
  userGroupCode: string;
  userNumber: string;
  workstationId: string;
  sessionType: string;
  sessionStart: string;
  sessionExpiry: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  
  // Display information
  userProfileDisplay: string;
  userGroupDisplay: string;
  officeDisplay: string;
}

export interface CreateUserSessionRequest {
  userGroupCode: string;
  userNumber: string;
  workstationId: string;
  sessionType?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Form interfaces for UI
export interface UserFormData extends Omit<CreateUserRequest, 'personalDetails' | 'geographicAssignment'> {
  // Flattened personal details for form handling
  idType: IDType;
  idNumber: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  alternativePhone?: string;
  
  // Flattened geographic assignment
  countryCode: string;
  provinceCode: string;
  region?: string;
  
  // Location assignment (new field)
  location_id?: string;
  
  // Access level (replaces authorityLevel)
  access_level: string;
  
  // Address information for staff assignment
  street_address?: string;
  city?: string;
  postal_code?: string;
  
  // Additional form fields
  confirmPassword: string;
}

// Lookup data for dropdowns
export interface UserGroup {
  id: string;
  user_group_code: string;
  user_group_name: string;
  user_group_type: string;
  province_code: string;
  is_active: boolean;
  registration_status: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  operational_notes?: string;
  service_area_description?: string;
  created_at: string;
  updated_at: string;
  authority_level: string;
  is_dltc: boolean;
  can_access_all_provinces: boolean;
}

export interface Office {
  id: string;
  officeCode: string;
  name: string;
  userGroupId: string;
  isActive: boolean;
}

export interface Province {
  code: string;
  name: string;
  countryCode: string;
}

// Error handling
export interface UserManagementError {
  code: string;
  message: string;
  field?: string;
  validationCode?: string; // V06001-V06005
}

// Export grouped types for easier imports
export type {
  User as UserProfile, // Alias for backward compatibility
  CreateUserRequest as UserProfileCreate,
  UpdateUserRequest as UserProfileUpdate,
  UserListResponse as UserProfileListResponse
}; 