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
  Check as CheckIcon
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
  'Security & Permissions',
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
  userGroupCode: yup.string().required('User group is required'),
  officeCode: yup.string().required('Office is required'),
  userTypeCode: yup.string().required('User type is required'),
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
      isActive: true,
      authorityLevel: AuthorityLevel.OFFICE,
      userTypeCode: UserType.STANDARD,
      requirePasswordChange: true,
      require2fa: false,
      language: 'en',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY'
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
    if (watchedFields.userGroupCode) {
      loadOfficesByUserGroup(watchedFields.userGroupCode);
    }
  }, [watchedFields.userGroupCode]);

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
      const userGroup = userGroups.find(ug => ug.user_group_code === userGroupCode);
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
      
      // Populate form with user data
      Object.entries(userData).forEach(([key, value]) => {
        if (key in watchedFields) {
          setValue(key as keyof UserFormData, value);
        }
      });
      
      // Handle nested objects
      if (userData.personalDetails) {
        setValue('fullName', userData.personalDetails.fullName);
        setValue('email', userData.personalDetails.email);
        setValue('phoneNumber', userData.personalDetails.phoneNumber);
        setValue('alternativePhone', userData.personalDetails.alternativePhone);
        setValue('idType', userData.personalDetails.idType);
        setValue('idNumber', userData.personalDetails.idNumber);
      }
      
      if (userData.geographicAssignment) {
        setValue('countryCode', userData.geographicAssignment.countryCode);
        setValue('provinceCode', userData.geographicAssignment.provinceCode);
        setValue('region', userData.geographicAssignment.region);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFormSubmit: SubmitHandler<UserFormData> = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Transform form data to API format (backend expects snake_case)
      const userData = {
        // Core identification (snake_case for backend)
        user_group_code: data.userGroupCode,
        office_code: data.officeCode,
        user_name: data.fullName, // Backend expects user_name (display name)
        user_type_code: data.userTypeCode,
        
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
        employee_id: data.employeeId,
        department: data.department,
        job_title: data.jobTitle,
        infrastructure_number: data.infrastructureNumber,
        
        // Status
        status: data.status,
        is_active: data.isActive,
        
        // Role assignments
        role_ids: [], // Will be populated based on userType
        permission_ids: [], // Will be populated based on userType
        
        // Security
        require_password_change: data.requirePasswordChange,
        require_2fa: data.require2fa,
        
        // System settings
        language: data.language,
        timezone: data.timezone,
        date_format: data.dateFormat
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
        return ['userGroupCode', 'officeCode', 'userTypeCode', 'countryCode', 'provinceCode'];
      case 2: // Security & Permissions
        return ['username', 'password', 'confirmPassword', 'status', 'authorityLevel'];
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
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicInformationStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter the user's personal details and identification information.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
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
      </CardContent>
    </Card>
  );

  const renderWorkAssignmentStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Work Assignment
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Assign the user to a user group, office, and set their work details.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* User Group */}
          <Grid item xs={12} md={6}>
            <Controller
              name="userGroupCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.userGroupCode}>
                  <InputLabel>User Group *</InputLabel>
                  <Select {...field} label="User Group *">
                    {userGroups.map((group) => (
                      <MenuItem key={group.id} value={group.user_group_code}>
                        {group.user_group_name} ({group.user_group_code})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.userGroupCode?.message || 'V06001: User Group must be active and valid'}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Office */}
          <Grid item xs={12} md={6}>
            <Controller
              name="officeCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.officeCode}>
                  <InputLabel>Office *</InputLabel>
                  <Select {...field} label="Office *" disabled={!watchedFields.userGroupCode}>
                    {offices.map((office) => (
                      <MenuItem key={office.id} value={office.officeCode}>
                        {office.name} ({office.officeCode})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.officeCode?.message || 'V06002: Office must exist within selected User Group'}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* User Type */}
          <Grid item xs={12} md={6}>
            <Controller
              name="userTypeCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.userTypeCode}>
                  <InputLabel>User Type *</InputLabel>
                  <Select {...field} label="User Type *">
                    <MenuItem value={UserType.STANDARD}>Standard User</MenuItem>
                    <MenuItem value={UserType.EXAMINER}>Examiner</MenuItem>
                    <MenuItem value={UserType.SUPERVISOR}>Supervisor</MenuItem>
                    <MenuItem value={UserType.ADMIN}>Administrator</MenuItem>
                    <MenuItem value={UserType.SYSTEM}>System User</MenuItem>
                  </Select>
                  <FormHelperText>{errors.userTypeCode?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

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
                    />
                  )}
                  onChange={(_, value) => field.onChange(value)}
                  value={field.value || ''}
                />
              )}
            />
          </Grid>

          {/* Job Title */}
          <Grid item xs={12} md={6}>
            <Controller
              name="jobTitle"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Job Title"
                />
              )}
            />
          </Grid>

          {/* Employee ID */}
          <Grid item xs={12} md={6}>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Employee ID"
                />
              )}
            />
          </Grid>

          {/* Country */}
          <Grid item xs={12} md={6}>
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.countryCode}>
                  <InputLabel>Country *</InputLabel>
                  <Select {...field} label="Country *">
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
                  <Select {...field} label="Province *">
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
      </CardContent>
    </Card>
  );

  const renderSecurityStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Security & Permissions
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Set up user authentication and define their system access level.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Username */}
          <Grid item xs={12} md={6}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Username *"
                  error={!!errors.username || !usernameValidation.valid}
                  helperText={errors.username?.message || usernameValidation.message || 'V06003: Username must be unique within User Group'}
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

          {/* Authority Level */}
          <Grid item xs={12} md={6}>
            <Controller
              name="authorityLevel"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.authorityLevel}>
                  <InputLabel>Authority Level *</InputLabel>
                  <Select {...field} label="Authority Level *">
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

          {/* Active Status */}
          <Grid item xs={12}>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
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
              name="requirePasswordChange"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
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
              name="require2fa"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  }
                  label="Require Two-Factor Authentication"
                />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
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
                  {userGroups.find(ug => ug.user_group_code === watchedFields.userGroupCode)?.user_group_name || watchedFields.userGroupCode}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Office</Typography>
                <Typography variant="body1">
                  {offices.find(o => o.officeCode === watchedFields.officeCode)?.name || watchedFields.officeCode}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">User Type</Typography>
                <Typography variant="body1">{watchedFields.userTypeCode}</Typography>
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
                <Typography variant="body1">{watchedFields.isActive ? 'Yes' : 'No'}</Typography>
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
            • User will {watchedFields.requirePasswordChange ? 'be required to' : 'not be required to'} change password on first login
            • Two-factor authentication is {watchedFields.require2fa ? 'enabled' : 'disabled'}
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