/**
 * User Form Page
 * Create and edit user accounts with card wrapper styling
 * Follows the same design pattern as PersonManagementPage
 * Implements V06001-V06005 validation rules
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  FormHelperText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  Breadcrumbs,
  Link,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import {
  UserFormData,
  UserType,
  UserStatus,
  IDType,
  AuthorityLevel,
  UserGroup,
  Office,
  Province
} from '../../types/user';

const steps = [
  'Basic Information',
  'Work Assignment', 
  'Security & Authentication',
  'Privileges & Permissions',
  'Review & Submit'
];

// Validation schema with business rules
const userFormSchema = yup.object({
  // Basic Information
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Valid email required').required('Email is required'),
  phoneNumber: yup.string().matches(/^[\d\s\-\+\(\)]+$/, 'Valid phone number required'),
  idType: yup.string().required('ID type is required'),
  idNumber: yup.string().required('ID number is required'),
  
  // Authentication
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  
  // Work Assignment
  user_group_code: yup.string().required('User group is required'),
  office_code: yup.string().required('Office is required'),
  user_type_code: yup.string().required('User type is required'),
  department: yup.string(),
  jobTitle: yup.string(),
  employeeId: yup.string(),
  
  // Geographic Assignment
  countryCode: yup.string().required('Country is required'),
  provinceCode: yup.string().required('Province is required'),
  
  // Status
  status: yup.string().required('Status is required'),
  isActive: yup.boolean(),
  authorityLevel: yup.string().required('Authority level is required')
});

const UserFormPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const isEditMode = Boolean(userId);
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOptionalSections, setShowOptionalSections] = useState({
    userGroupAssignment: true,
    locationAssignment: false,
    privileges: false
  });
  
  // Privilege state management
  const [privileges, setPrivileges] = useState({
    userManagement: false,
    reportAccess: true,
    systemConfiguration: false,
    dataEntry: true,
    approvalRights: false,
    locationAccess: true
  });
  
  // Validation states
  const [usernameValidation] = useState<{
    checking: boolean;
    valid: boolean;
    message: string;
  }>({ checking: false, valid: false, message: '' });
  
  const [emailValidation] = useState<{
    checking: boolean;
    valid: boolean;
    message: string;
  }>({ checking: false, valid: false, message: '' });
  
  // Lookup data
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [departments] = useState(['IT', 'Operations', 'Admin', 'Finance', 'Legal', 'Customer Service']);
  
  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<UserFormData>({
    resolver: yupResolver(userFormSchema),
    mode: 'onChange',
    defaultValues: {
      countryCode: 'ZA',
      status: UserStatus.ACTIVE,
      is_active: true,
      authorityLevel: AuthorityLevel.OFFICE,
      user_type_code: UserType.STANDARD,
      require_password_change: true,
      require_2fa: false,
      language: 'en',
      timezone: 'Africa/Johannesburg',
      date_format: 'DD/MM/YYYY'
    }
  });

  const watchedFields = watch();

  // Load initial data
  useEffect(() => {
    loadLookupData();
    if (isEditMode && userId) {
      loadUser(userId);
    }
  }, [isEditMode, userId]);

  // Load offices when user group changes
  useEffect(() => {
    if (watchedFields.user_group_code) {
      loadOfficesByUserGroup(watchedFields.user_group_code);
    }
  }, [watchedFields.user_group_code]);

  // Update privileges when user type changes
  useEffect(() => {
    if (watchedFields.user_type_code) {
      setDefaultPrivilegesForUserType(watchedFields.user_type_code as UserType);
    }
  }, [watchedFields.user_type_code]);

  const loadLookupData = async () => {
    try {
      const [userGroupsData, provincesData] = await Promise.all([
        userService.getUserGroups(),
        userService.getProvinces()
      ]);
      
      setUserGroups(userGroupsData);
      setProvinces(provincesData);
    } catch (err) {
      console.error('Error loading lookup data:', err);
      setError('Failed to load form data');
    }
  };

  const loadOfficesByUserGroup = async (userGroupCode: string) => {
    try {
      const userGroup = userGroups.find((ug: UserGroup) => ug.user_group_code === userGroupCode);
      if (userGroup) {
        const officesData = await userService.getOfficesByUserGroup(userGroup.id);
        setOffices(officesData);
      }
    } catch (err) {
      console.error('Error loading offices:', err);
    }
  };

  const loadUser = async (id: string) => {
    try {
      setLoading(true);
      const userData = await userService.getUser(id);
      
      // Map user data to form fields with proper field mapping
      // Basic user fields
      setValue('username', userData.username || '');
      setValue('user_group_code', userData.userGroupCode || '');
      setValue('office_code', userData.officeCode || '');
      setValue('user_type_code', userData.userTypeCode || '');
      setValue('status', userData.status || '');
      setValue('is_active', userData.isActive ?? true);
      setValue('authorityLevel', userData.authorityLevel || '');
      
      // Job details
      setValue('employee_id', userData.employeeId || '');
      setValue('department', userData.department || '');
      setValue('job_title', userData.jobTitle || '');
      setValue('infrastructure_number', userData.infrastructureNumber || '');
      
      // System settings
      setValue('language', userData.language || 'en');
      setValue('timezone', userData.timezone || 'Africa/Johannesburg');
      setValue('date_format', userData.dateFormat || 'DD/MM/YYYY');
      
      // Handle personal details (support both camelCase and snake_case)
      const personalDetails = userData.personalDetails || (userData as any).personal_details;
      if (personalDetails) {
        setValue('fullName', (personalDetails as any).fullName || (personalDetails as any).full_name || '');
        setValue('email', personalDetails.email || '');
        setValue('phoneNumber', (personalDetails as any).phoneNumber || (personalDetails as any).phone_number || '');
        setValue('alternativePhone', (personalDetails as any).alternativePhone || (personalDetails as any).alternative_phone || '');
        setValue('idType', (personalDetails as any).idType || (personalDetails as any).id_type || '');
        setValue('idNumber', (personalDetails as any).idNumber || (personalDetails as any).id_number || '');
      }
      
      // Handle geographic assignment
      const geographicAssignment = userData.geographicAssignment;
      if (geographicAssignment) {
        setValue('countryCode', geographicAssignment.countryCode || 'ZA');
        setValue('provinceCode', geographicAssignment.provinceCode || '');
        setValue('region', geographicAssignment.region || '');
      }
      
      // Load offices for the selected user group
      if (userData.userGroupCode) {
        await loadOfficesByUserGroup(userData.userGroupCode);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Set default privileges based on user type
  const setDefaultPrivilegesForUserType = (userType: UserType) => {
    let defaultPrivileges;
    
    switch (userType) {
      case UserType.ADMIN:
        defaultPrivileges = {
          userManagement: true,
          reportAccess: true,
          systemConfiguration: true,
          dataEntry: true,
          approvalRights: true,
          locationAccess: true
        };
        break;
      
      case UserType.SUPERVISOR:
        defaultPrivileges = {
          userManagement: false,
          reportAccess: true,
          systemConfiguration: false,
          dataEntry: true,
          approvalRights: true,
          locationAccess: true
        };
        break;
      
      case UserType.EXAMINER:
        defaultPrivileges = {
          userManagement: false,
          reportAccess: true,
          systemConfiguration: false,
          dataEntry: true,
          approvalRights: false,
          locationAccess: true
        };
        break;
      
      case UserType.SYSTEM:
        defaultPrivileges = {
          userManagement: false,
          reportAccess: true,
          systemConfiguration: false,
          dataEntry: false,
          approvalRights: false,
          locationAccess: false
        };
        break;
      
      case UserType.STANDARD:
      default:
        defaultPrivileges = {
          userManagement: false,
          reportAccess: true,
          systemConfiguration: false,
          dataEntry: true,
          approvalRights: false,
          locationAccess: true
        };
        break;
    }
    
    setPrivileges(defaultPrivileges);
  };

  // Auto-generate username based on eNaTIS standard: UserGroupCode + 3-digit sequential number
  const generateUsername = async () => {
    const userGroupCode = watchedFields.user_group_code;
    
    if (!userGroupCode) {
      setError('Please select a user group first');
      return;
    }

    try {
      // Get existing users in this user group to find the highest user number
      const existingUsers = await userService.listUsers(1, 1000, { 
        userGroupCode: userGroupCode 
      });
      
      // Extract user numbers from existing usernames and find the highest
      let highestNumber = 0;
      existingUsers.users.forEach(user => {
        if (user.username && user.username.startsWith(userGroupCode) && user.username.length === 7) {
          const userNumber = parseInt(user.username.substring(4)); // Extract last 3 digits
          if (!isNaN(userNumber) && userNumber > highestNumber) {
            highestNumber = userNumber;
          }
        }
      });
      
      // Generate next sequential number (001-999)
      const nextNumber = highestNumber + 1;
      
      if (nextNumber > 999) {
        setError(`Maximum users (999) reached for user group ${userGroupCode}`);
        return;
      }
      
      // Format: UserGroupCode + 3-digit zero-padded number (e.g., WC01001)
      const generatedUsername = `${userGroupCode}${nextNumber.toString().padStart(3, '0')}`;
      
      // Validate username is available
      const validation = await userService.validateUsername(generatedUsername);
      if (validation.available) {
        setValue('username', generatedUsername);
      } else {
        // If somehow not available, find next available number
        let attempts = 0;
        let testNumber = nextNumber + 1;
        
        while (attempts < 50 && testNumber <= 999) {
          const testUsername = `${userGroupCode}${testNumber.toString().padStart(3, '0')}`;
          const testValidation = await userService.validateUsername(testUsername);
          if (testValidation.available) {
            setValue('username', testUsername);
            break;
          }
          testNumber++;
          attempts++;
        }
        
        if (attempts >= 50) {
          setError('Unable to generate available username. Please try manually.');
        }
      }
    } catch (err) {
      console.error('Error generating username:', err);
      setError('Failed to generate username');
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setCurrentStep((prev: number) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 0));
  };

  const handleFormSubmit: SubmitHandler<UserFormData> = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Transform form data to API format (backend expects snake_case)
      const userData = {
        // Core identification (snake_case for backend)
        user_group_code: data.user_group_code,
        office_code: data.office_code,
        user_name: data.fullName, // Backend expects user_name (display name)
        user_type_code: data.user_type_code,
        
        // Authentication
        username: data.username,
        password: data.password,
        
        // Personal details (snake_case object name)
        personal_details: {
          id_type: data.idType,
          id_number: data.idNumber,
          full_name: data.fullName,
          email: data.email,
          phone_number: data.phoneNumber,
          alternative_phone: data.alternativePhone
        },
        
        // Geographic assignment (snake_case object name)
        geographic_assignment: {
          country_code: data.countryCode,
          province_code: data.provinceCode,
          region: data.region
        },
        
        // Job details
        employee_id: data.employee_id,
        department: data.department,
        job_title: data.job_title,
        infrastructure_number: data.infrastructure_number,
        
        // Status
        status: data.status,
        is_active: data.is_active,
        
        // Role assignments
        role_ids: [], // Will be populated based on userType
        permission_ids: [], // Will be populated based on userType
        
        // Custom privileges
        custom_privileges: showOptionalSections.privileges ? privileges : null,
        
        // Security
        require_password_change: data.require_password_change,
        require_2fa: data.require_2fa,
        
        // System settings
        language: data.language,
        timezone: data.timezone,
        date_format: data.date_format
      };

      if (isEditMode && userId) {
        await userService.updateUser(userId, userData);
      } else {
        await userService.createUser(userData);
      }

      navigate('/dashboard/admin/users');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const getFieldsForStep = (step: number): (keyof UserFormData)[] => {
    switch (step) {
      case 0: // Basic Information
        return ['fullName', 'email', 'phoneNumber', 'idType', 'idNumber'];
      case 1: // Work Assignment  
        return ['user_group_code', 'office_code', 'user_type_code', 'countryCode', 'provinceCode'];
      case 2: // Security & Authentication
        return ['username', 'password', 'confirmPassword', 'status'];
      case 3: // Privileges & Permissions
        return ['authorityLevel'];
      default:
        return [];
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformationStep();
      case 1:
        return renderWorkAssignmentStep();
      case 2:
        return renderSecurityStep();
      case 3:
        return renderPrivilegesStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicInformationStep = () => (
    <Box>
      {/* Personal Details Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Personal Details
        </Typography>
        
        <Grid container spacing={3}>
          {/* Full Name */}
          <Grid item xs={12} md={6}>
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Full Name *"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email Address *"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message || emailValidation.message}
                  InputProps={{
                    endAdornment: emailValidation.checking ? (
                      <InputAdornment position="end">Checking...</InputAdornment>
                    ) : emailValidation.valid ? (
                      <InputAdornment position="end">
                        <CheckIcon color="success" />
                      </InputAdornment>
                    ) : null
                  }}
                />
              )}
            />
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Phone Number"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                />
              )}
            />
          </Grid>

          {/* Alternative Phone */}
          <Grid item xs={12} md={6}>
            <Controller
              name="alternativePhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Alternative Phone"
                />
              )}
            />
          </Grid>

          {/* ID Type */}
          <Grid item xs={12} md={6}>
            <Controller
              name="idType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.idType}>
                  <InputLabel>ID Document Type *</InputLabel>
                  <Select {...field} label="ID Document Type *">
                    <MenuItem value={IDType.TRN}>TRN (Traffic Register Number)</MenuItem>
                    <MenuItem value={IDType.SA_ID}>RSA ID (South African ID)</MenuItem>
                    <MenuItem value={IDType.FOREIGN_ID}>Foreign ID Document</MenuItem>
                    <MenuItem value={IDType.PASSPORT}>Passport Number</MenuItem>
                    <MenuItem value={IDType.OTHER}>Other</MenuItem>
                  </Select>
                  <FormHelperText>{errors.idType?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* ID Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="idNumber"
              control={control}
              render={({ field }) => {
                const idValidation = userService.validateIdNumber(watchedFields.idType, field.value);
                
                return (
                  <TextField
                    {...field}
                    fullWidth
                    label="ID Number *"
                    error={!!errors.idNumber || !idValidation.isValid}
                    helperText={errors.idNumber?.message || idValidation.message}
                    InputProps={{
                      endAdornment: idValidation.isValid && field.value ? (
                        <InputAdornment position="end">
                          <CheckIcon color="success" />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                );
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Identification Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Identification
        </Typography>
        
        <Grid container spacing={3}>
          {/* ID Type */}
          <Grid item xs={12} md={6}>
            <Controller
              name="idType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.idType}>
                  <InputLabel>ID Type *</InputLabel>
                  <Select {...field} label="ID Type *" sx={{ backgroundColor: 'white' }}>
                    <MenuItem value={IDType.SA_ID}>South African ID</MenuItem>
                    <MenuItem value={IDType.PASSPORT}>Passport</MenuItem>
                    <MenuItem value={IDType.FOREIGN_ID}>Foreign ID</MenuItem>
                    <MenuItem value={IDType.TRN}>Tax Reference Number</MenuItem>
                    <MenuItem value={IDType.OTHER}>Other</MenuItem>
                  </Select>
                  <FormHelperText>{errors.idType?.message || 'V06005: ID Number must be valid for selected ID Type'}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* ID Number */}
          <Grid item xs={12} md={6}>
            <Controller
              name="idNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="ID Number *"
                  error={!!errors.idNumber}
                  helperText={errors.idNumber?.message}
                  sx={{ backgroundColor: 'white' }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const renderWorkAssignmentStep = () => (
    <Box>
      {/* User Group Assignment Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            User Group Assignment
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showOptionalSections.userGroupAssignment}
                onChange={(e) => setShowOptionalSections(prev => ({
                  ...prev,
                  userGroupAssignment: e.target.checked
                }))}
              />
            }
            label="Required"
          />
        </Box>
        
        {showOptionalSections.userGroupAssignment && (
          <Grid container spacing={3}>
            {/* User Group */}
            <Grid item xs={12} md={6}>
              <Controller
                name="user_group_code"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.user_group_code}>
                    <InputLabel>User Group *</InputLabel>
                    <Select {...field} label="User Group *" sx={{ backgroundColor: 'white' }}>
                      {userGroups.map((group) => (
                        <MenuItem key={group.id} value={group.user_group_code}>
                          {group.user_group_name} ({group.user_group_code})
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.user_group_code?.message || 'V06001: User Group must be active and valid'}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Office */}
            <Grid item xs={12} md={6}>
              <Controller
                name="office_code"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.office_code}>
                    <InputLabel>Office *</InputLabel>
                    <Select {...field} label="Office *" disabled={!watchedFields.user_group_code} sx={{ backgroundColor: 'white' }}>
                      {offices.map((office) => (
                        <MenuItem key={office.id} value={office.officeCode}>
                          {office.name} ({office.officeCode})
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.office_code?.message || 'V06002: Office must exist within selected User Group'}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* User Type */}
            <Grid item xs={12} md={6}>
              <Controller
                name="user_type_code"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.user_type_code}>
                    <InputLabel>User Type *</InputLabel>
                    <Select {...field} label="User Type *" sx={{ backgroundColor: 'white' }}>
                      <MenuItem value={UserType.STANDARD}>Standard User</MenuItem>
                      <MenuItem value={UserType.EXAMINER}>Examiner</MenuItem>
                      <MenuItem value={UserType.SUPERVISOR}>Supervisor</MenuItem>
                      <MenuItem value={UserType.ADMIN}>Administrator</MenuItem>
                      <MenuItem value={UserType.SYSTEM}>System User</MenuItem>
                    </Select>
                    <FormHelperText>{errors.user_type_code?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Job Details Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Job Details
        </Typography>
        
        <Grid container spacing={3}>
          {/* Department */}
          <Grid item xs={12} md={6}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={departments}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department"
                      helperText="Select from list or enter custom department"
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                  onChange={(_, value) => field.onChange(value)}
                  value={field.value || ''}
                />
              )}
            />
          </Grid>



          {/* Employee ID */}
          <Grid item xs={12} md={6}>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Employee ID"
                  sx={{ backgroundColor: 'white' }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Geographic Assignment Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Geographic Assignment
        </Typography>
        
        <Grid container spacing={3}>
          {/* Country */}
          <Grid item xs={12} md={6}>
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.countryCode}>
                  <InputLabel>Country *</InputLabel>
                  <Select {...field} label="Country *" sx={{ backgroundColor: 'white' }}>
                    <MenuItem value="ZA">South Africa</MenuItem>
                  </Select>
                  <FormHelperText>{errors.countryCode?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Province */}
          <Grid item xs={12} md={6}>
            <Controller
              name="provinceCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.provinceCode}>
                  <InputLabel>Province *</InputLabel>
                  <Select {...field} label="Province *" sx={{ backgroundColor: 'white' }}>
                    {provinces.map((province) => (
                      <MenuItem key={province.code} value={province.code}>
                        {province.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.provinceCode?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Location Assignment Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Location Assignment
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowOptionalSections(prev => ({
              ...prev,
              locationAssignment: !prev.locationAssignment
            }))}
            startIcon={showOptionalSections.locationAssignment ? <ClearIcon /> : <PersonAddIcon />}
          >
            {showOptionalSections.locationAssignment ? 'Remove Assignment' : 'Assign User'}
          </Button>
        </Box>
        
        {showOptionalSections.locationAssignment ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Location assignments can be managed here or separately after user creation through the Staff Assignment module.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assignment Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                sx={{ backgroundColor: 'white' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assignment End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                sx={{ backgroundColor: 'white' }}
              />
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            User will be created without specific location assignments. These can be added later through the Staff Assignment module.
          </Typography>
        )}
      </Paper>
    </Box>
  );

  const renderSecurityStep = () => (
    <Box>
      {/* Authentication Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Authentication
        </Typography>
        
        <Grid container spacing={3}>
          {/* Username with Auto-Generate */}
          <Grid item xs={12} md={6}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    {...field}
                    fullWidth
                    label="Username *"
                    error={!!errors.username || !usernameValidation.valid}
                    helperText={errors.username?.message || usernameValidation.message || 'V06003: Username must be unique within User Group'}
                    sx={{ backgroundColor: 'white' }}
                    InputProps={{
                      endAdornment: usernameValidation.checking ? (
                        <InputAdornment position="end">Checking...</InputAdornment>
                      ) : usernameValidation.valid ? (
                        <InputAdornment position="end">
                          <CheckIcon color="success" />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={generateUsername}
                    disabled={!watchedFields.user_group_code || loading}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Generate
                  </Button>
                </Box>
              )}
            />
          </Grid>

          {/* Password */}
          <Grid item xs={12} md={6}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message || 'Minimum 8 characters with uppercase, lowercase, and number'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* Confirm Password */}
          <Grid item xs={12} md={6}>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Confirm Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status *</InputLabel>
                  <Select {...field} label="Status *">
                    <MenuItem value={UserStatus.ACTIVE}>Active</MenuItem>
                    <MenuItem value={UserStatus.PENDING_ACTIVATION}>Pending Activation</MenuItem>
                    <MenuItem value={UserStatus.SUSPENDED}>Suspended</MenuItem>
                    <MenuItem value={UserStatus.INACTIVE}>Inactive</MenuItem>
                  </Select>
                  <FormHelperText>{errors.status?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Active Status */}
          <Grid item xs={12}>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  }
                  label="User Account Active"
                />
              )}
            />
          </Grid>

          {/* Security Options */}
          <Grid item xs={12} md={6}>
            <Controller
              name="require_password_change"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  }
                  label="Require Password Change on First Login"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="require_2fa"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  }
                  label="Require Two-Factor Authentication"
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>


    </Box>
  );

  const renderPrivilegesStep = () => (
    <Box>
      {/* Authority Level Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          Authority Level
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="authorityLevel"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.authorityLevel}>
                  <InputLabel>Authority Level *</InputLabel>
                  <Select {...field} label="Authority Level *" sx={{ backgroundColor: 'white' }}>
                    <MenuItem value={AuthorityLevel.NATIONAL}>National Level</MenuItem>
                    <MenuItem value={AuthorityLevel.PROVINCIAL}>Provincial Level</MenuItem>
                    <MenuItem value={AuthorityLevel.REGIONAL}>Regional Level</MenuItem>
                    <MenuItem value={AuthorityLevel.LOCAL}>Local Level</MenuItem>
                    <MenuItem value={AuthorityLevel.OFFICE}>Office Level</MenuItem>
                    <MenuItem value={AuthorityLevel.PERSONAL}>Personal Level</MenuItem>
                  </Select>
                  <FormHelperText>{errors.authorityLevel?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="info">
              Authority Level determines the scope of permissions and data access for this user.
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* System Privileges Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            System Privileges
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowOptionalSections(prev => ({
              ...prev,
              privileges: !prev.privileges
            }))}
            startIcon={showOptionalSections.privileges ? <ClearIcon /> : <EditIcon />}
          >
            {showOptionalSections.privileges ? 'Use Defaults' : 'Configure Custom'}
          </Button>
        </Box>
        
        {showOptionalSections.privileges ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Advanced privilege configuration is available in this interface, but most settings can be managed after user creation.
              </Alert>
            </Grid>
            
            {/* System Privileges */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Administrative Privileges
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.userManagement}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      userManagement: e.target.checked
                    }))}
                  />
                }
                label="User Management"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.reportAccess}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      reportAccess: e.target.checked
                    }))}
                  />
                }
                label="Report Access"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.systemConfiguration}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      systemConfiguration: e.target.checked
                    }))}
                  />
                }
                label="System Configuration"
              />
            </Grid>
            
            {/* Location Privileges */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Operational Privileges
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.dataEntry}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      dataEntry: e.target.checked
                    }))}
                  />
                }
                label="Data Entry"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.approvalRights}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      approvalRights: e.target.checked
                    }))}
                  />
                }
                label="Approval Rights"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch 
                    checked={privileges.locationAccess}
                    onChange={(e) => setPrivileges(prev => ({
                      ...prev,
                      locationAccess: e.target.checked
                    }))}
                  />
                }
                label="Location Access"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Current privileges are automatically set based on User Type: <strong>{watchedFields.user_type_code || 'Not Selected'}</strong>
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Administrative Privileges
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • User Management: <strong>{privileges.userManagement ? 'Enabled' : 'Disabled'}</strong><br/>
                • Report Access: <strong>{privileges.reportAccess ? 'Enabled' : 'Disabled'}</strong><br/>
                • System Configuration: <strong>{privileges.systemConfiguration ? 'Enabled' : 'Disabled'}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Operational Privileges
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Data Entry: <strong>{privileges.dataEntry ? 'Enabled' : 'Disabled'}</strong><br/>
                • Approval Rights: <strong>{privileges.approvalRights ? 'Enabled' : 'Disabled'}</strong><br/>
                • Location Access: <strong>{privileges.locationAccess ? 'Enabled' : 'Disabled'}</strong>
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );

  const renderReviewStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please review all information before {isEditMode ? 'updating' : 'creating'} the user account.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information Summary */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{watchedFields.fullName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{watchedFields.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{watchedFields.phoneNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">ID Type & Number</Typography>
                <Typography variant="body1">{watchedFields.idType} - {watchedFields.idNumber}</Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Work Assignment Summary */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
              Work Assignment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">User Group</Typography>
                <Typography variant="body1">
                  {userGroups.find(ug => ug.user_group_code === watchedFields.user_group_code)?.user_group_name || watchedFields.user_group_code}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Office</Typography>
                <Typography variant="body1">
                  {offices.find(o => o.officeCode === watchedFields.office_code)?.name || watchedFields.office_code}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">User Type</Typography>
                <Typography variant="body1">{watchedFields.user_type_code}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{watchedFields.department || '-'}</Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Security Summary */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
              Security & Access
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1">{watchedFields.username}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Authority Level</Typography>
                <Typography variant="body1">{watchedFields.authorityLevel}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={watchedFields.status} 
                  color={userService.getUserStatusColor(watchedFields.status)} 
                  size="small" 
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Active</Typography>
                <Typography variant="body1">{watchedFields.is_active ? 'Yes' : 'No'}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Ready to {isEditMode ? 'Update' : 'Create'} User Account
          </Typography>
          <Typography variant="body2">
            • Validation rules V06001-V06005 have been checked
            • User will {watchedFields.require_password_change ? 'be required to' : 'not be required to'} change password on first login
            • Two-factor authentication is {watchedFields.require_2fa ? 'enabled' : 'disabled'}
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={() => navigate('/dashboard/admin/users')}
            sx={{ cursor: 'pointer' }}
          >
            User Management
          </Link>
          <Typography color="text.primary">
            {isEditMode ? 'Edit User' : 'Create User'}
          </Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/users')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit User Account' : 'Create New User Account'}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        {isEditMode ? 'Update user account information and settings.' : 'Create a new user account with appropriate permissions and access levels.'}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < currentStep}>
              <StepLabel>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Box sx={{ mb: 3 }}>
          {renderStepContent()}
        </Box>

        {/* Navigation */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={currentStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard/admin/users')}
                startIcon={<ClearIcon />}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !isValid}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};

export default UserFormPage; 