import { useState, useEffect } from 'react';
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
  Divider,
  FormControlLabel,
  Checkbox,
  Autocomplete
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

// Types based on backend models
interface PersonRegistrationForm {
  // Core Identity Fields (P00068 - Particulars of Applicant)
  business_or_surname: string;
  initials?: string;
  person_nature: string; // PersonNature enum 01-17
  nationality_code: string;
  preferred_language?: string;
  
  // Contact Information
  email_address?: string;
  home_phone_code?: string;
  home_phone_number?: string;
  work_phone_code?: string;
  work_phone_number?: string;
  cell_phone?: string;
  fax_code?: string;
  fax_number?: string;
  
  // Natural Person Details (if person_nature 01/02)
  natural_person?: {
    full_name_1: string;
    full_name_2?: string;
    full_name_3?: string;
    birth_date?: string;
    preferred_language_code?: string;
  };
  
  // ID Documents/Aliases (V00001-V00019)
  aliases: Array<{
    id_document_type_code: string; // IdentificationType enum
    id_document_number: string;
    country_of_issue: string;
    name_in_document?: string;
    alias_status: string;
    is_current: boolean;
  }>;
  
  // Addresses (P00023 - Driver Address Particulars)
  addresses: Array<{
    address_type: string; // 'street' or 'postal'
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    address_line_4?: string; // suburb
    address_line_5?: string; // city/town
    postal_code?: string;
    country_code: string;
    province_code?: string;
    is_primary: boolean;
  }>;
}

// eNaTIS Field Format Validation based on Transaction 57 specifications
const validationSchema = yup.object({
  // SCHAR1 format: SPACE, A-Z, 0-9, -, &, (, ), ', Ë, É, Ä, Ö, Ü, Ç (max 32)
  business_or_surname: yup.string()
    .required('Business name or surname is mandatory (V00043)')
    .max(32, 'Maximum 32 characters')
    .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid characters. Use only letters, numbers, and basic punctuation'),
  
  person_nature: yup.string().required('Person nature is mandatory (V00034)'),
  nationality_code: yup.string().required('Nationality is mandatory'),
  
  // ALPHA format: A-Z only (max 3)
  initials: yup.string()
    .max(3, 'Maximum 3 characters')
    .matches(/^[A-Z]*$/, 'Initials must be uppercase letters only')
    .when('person_nature', {
      is: (val: string) => ['01', '02'].includes(val),
      then: () => yup.string().required('Initials are mandatory for natural persons (V00051)'),
      otherwise: () => yup.string()
    }),
  
  // Natural person validation
  natural_person: yup.object().when('person_nature', {
    is: (val: string) => ['01', '02'].includes(val),
    then: () => yup.object({
      // SCHAR1 format (max 32)
      full_name_1: yup.string()
        .required('First name is mandatory for natural persons (V00056)')
        .max(32, 'Maximum 32 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid characters in first name'),
      full_name_2: yup.string()
        .max(32, 'Maximum 32 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid characters in middle name'),
      full_name_3: yup.string()
        .max(32, 'Maximum 32 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid characters in last name'),
      birth_date: yup.string().min('1840-01-01', 'Date must be after 1840-01-01')
    }),
    otherwise: () => yup.mixed().notRequired()
  }),
  
  // SCHAR4 format for email: ., A-Z, 0-9, @, _, - (max 50)
  email_address: yup.string()
    .max(50, 'Maximum 50 characters')
    .email('Invalid email format')
    .matches(/^[A-Z0-9@._\-]*$/i, 'Invalid email characters'),
  
  // SCHAR3 format for phone numbers: SPACE, A-Z, 0-9
  home_phone_code: yup.string()
    .max(10, 'Maximum 10 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid phone code format'),
  home_phone_number: yup.string()
    .max(10, 'Maximum 10 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid phone number format'),
  work_phone_code: yup.string()
    .max(10, 'Maximum 10 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid phone code format'),
  work_phone_number: yup.string()
    .max(15, 'Maximum 15 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid phone number format'),
  cell_phone: yup.string()
    .max(15, 'Maximum 15 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid cell phone format'),
  fax_code: yup.string()
    .max(10, 'Maximum 10 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid fax code format'),
  fax_number: yup.string()
    .max(10, 'Maximum 10 characters')
    .matches(/^[A-Z0-9\s]*$/i, 'Invalid fax number format'),
  
  // ID Documents validation - V00012: Only types 02,03 allowed for person introduction
  aliases: yup.array().of(
    yup.object({
      id_document_type_code: yup.string()
        .required('Identification type is mandatory (V00001)')
        .oneOf(['02', '03'], 'Only RSA ID (02) and Foreign ID (03) allowed for person introduction (V00012)'),
      // SCHAR2 format: A-Z, 0-9 (length 13 for specific types)
      id_document_number: yup.string()
        .required('Identification number is mandatory (V00013)')
        .matches(/^[A-Z0-9]*$/, 'Invalid ID format. Use only letters and numbers (SCHAR2)')
        .test('length-validation', 'RSA ID must be exactly 13 characters (V00018)', function(value) {
          const { id_document_type_code } = this.parent;
          if (id_document_type_code === '02') {
            return value?.length === 13;
          }
          return true;
        })
        .test('numeric-validation', 'RSA ID must be numeric only (V00017)', function(value) {
          const { id_document_type_code } = this.parent;
          if (id_document_type_code === '02') {
            return /^\d{13}$/.test(value || '');
          }
          return true;
        }),
      country_of_issue: yup.string().required('Country of issue is required'),
      alias_status: yup.string().required('Alias status is required')
    })
  ).min(1, 'At least one identification document is required'),
  
  // Address validation with eNaTIS formats
  addresses: yup.array().of(
    yup.object({
      address_type: yup.string().required('Address type is required'),
      // SCHAR1 format (max 35)
      address_line_1: yup.string()
        .max(35, 'Maximum 35 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid address characters')
        .when('address_type', {
          is: 'postal',
          then: () => yup.string().required('Address line 1 is mandatory for postal addresses (V00095)'),
          otherwise: () => yup.string().when('$isStreetAddress', {
            is: true,
            then: () => yup.string().required('Address line 1 is mandatory for street addresses (V00101)')
          })
        }),
      address_line_2: yup.string()
        .max(35, 'Maximum 35 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid address characters'),
      address_line_3: yup.string()
        .max(35, 'Maximum 35 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid address characters'),
      address_line_4: yup.string()
        .max(35, 'Maximum 35 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid address characters'),
      address_line_5: yup.string()
        .max(35, 'Maximum 35 characters')
        .matches(/^[A-Z0-9\s\-&()'ËÉÄÖÜÇ]*$/i, 'Invalid address characters'),
      // NUM format: 0-9 only (exactly 4 digits)
      postal_code: yup.string()
        .matches(/^\d{4}$/, 'Postal code must be exactly 4 digits (V00098)')
        .when(['address_type', 'address_line_1'], {
          is: (type: string, line1: string) => type === 'postal' && line1,
          then: () => yup.string().required('Postal code is mandatory for postal addresses'),
          otherwise: () => yup.string().when(['address_type', 'address_line_1'], {
            is: (type: string, line1: string) => type === 'street' && line1,
            then: () => yup.string().required('Postal code is mandatory when street address is provided (V00107/V00108)')
          })
        })
    })
  )
});

// Lookup data - these would come from API in real implementation
const PERSON_NATURES = [
  { value: '01', label: 'Male (Natural Person)' },
  { value: '02', label: 'Female (Natural Person)' },
  { value: '03', label: 'Company/Corporation' },
  { value: '10', label: 'Close Corporation' },
  { value: '11', label: 'Trust' },
  { value: '12', label: 'Partnership' },
  { value: '13', label: 'Sole Proprietorship' },
  { value: '14', label: 'Association' },
  { value: '15', label: 'Cooperative' },
  { value: '16', label: 'Non-Profit Organization' },
  { value: '17', label: 'Other Organization' }
];

const ID_DOCUMENT_TYPES = [
  { value: '01', label: 'TRN (Tax Reference Number)' },
  { value: '02', label: 'RSA ID (South African ID Document)' },
  { value: '03', label: 'Foreign ID (Foreign ID Document)' },
  { value: '04', label: 'BRN (Business Registration Number)' },
  { value: '13', label: 'Passport' }
];

const NATIONALITIES = [
  { value: 'ZA', label: 'South African' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  // Add more as needed
];

const PROVINCES = [
  { value: 'WC', label: 'Western Cape' },
  { value: 'GP', label: 'Gauteng' },
  { value: 'KZN', label: 'KwaZulu-Natal' },
  { value: 'EC', label: 'Eastern Cape' },
  { value: 'FS', label: 'Free State' },
  { value: 'LP', label: 'Limpopo' },
  { value: 'MP', label: 'Mpumalanga' },
  { value: 'NC', label: 'Northern Cape' },
  { value: 'NW', label: 'North West' }
];

const PersonRegistrationPage = () => {
  // Auth
  const { accessToken } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
    getValues
  } = useForm<PersonRegistrationForm>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      business_or_surname: '',
      person_nature: '',
      nationality_code: 'ZA',
      preferred_language: 'en',
      aliases: [{
        id_document_type_code: '',
        id_document_number: '',
        country_of_issue: 'ZA',
        alias_status: '1',
        is_current: true
      }],
      addresses: [{
        address_type: 'street',
        address_line_1: '',
        country_code: 'ZA',
        is_primary: true
      }]
    }
  });

  const { fields: aliasFields, append: appendAlias, remove: removeAlias } = useFieldArray({
    control,
    name: 'aliases'
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: 'addresses'
  });

  const watchedPersonNature = watch('person_nature');
  const watchedAliases = watch('aliases');

  // Auto-derive birth date and gender from RSA ID
  useEffect(() => {
    const aliases = getValues('aliases');
    const rsaIdAlias = aliases.find(a => a.id_document_type_code === '02');
    
    if (rsaIdAlias?.id_document_number?.length === 13) {
      const idNumber = rsaIdAlias.id_document_number;
      
      // Extract birth date (YYMMDD)
      const year = parseInt(idNumber.substring(0, 2));
      const month = parseInt(idNumber.substring(2, 4));
      const day = parseInt(idNumber.substring(4, 6));
      
      // Determine century (if year > 21, assume 1900s, else 2000s)
      const fullYear = year > 21 ? 1900 + year : 2000 + year;
      const birthDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Extract gender (position 6: 0-4=Female, 5-9=Male)
      const genderDigit = parseInt(idNumber.substring(6, 7));
      const personNature = genderDigit >= 5 ? '01' : '02'; // 01=Male, 02=Female
      
      setValue('person_nature', personNature);
      setValue('natural_person.birth_date', birthDate);
    }
  }, [watchedAliases, setValue, getValues]);

  const steps = [
    'Basic Information',
    'Identification Documents', 
    'Address Information',
    'Review & Submit'
  ];

  const onSubmit = async (data: PersonRegistrationForm) => {
    setSubmitLoading(true);
    setValidationErrors([]);
    
    try {
      // Call person creation API
      const response = await fetch(`${API_BASE_URL}/api/v1/persons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }
      
      setSubmitSuccess(true);
      reset();
      setCurrentStep(0);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message.includes('Validation failed:')) {
        const validationParts = error.message.split('Validation failed: ')[1].split('; ');
        setValidationErrors(validationParts);
      } else {
        setValidationErrors([error.message]);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderBasicInformation = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Basic Person Information
        </Typography>
        
        <Grid container spacing={3}>
          {/* Person Nature - Primary classification */}
          <Grid item xs={12} md={6}>
            <Controller
              name="person_nature"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.person_nature}>
                  <InputLabel>Person Nature *</InputLabel>
                  <Select {...field} label="Person Nature *">
                    {PERSON_NATURES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {errors.person_nature?.message || 'Select the type of person/entity (V00034)'}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Business/Surname */}
          <Grid item xs={12} md={6}>
            <Controller
              name="business_or_surname"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={['01', '02'].includes(watchedPersonNature) ? 'Surname *' : 'Business Name *'}
                  error={!!errors.business_or_surname}
                  helperText={errors.business_or_surname?.message || 'Business name or surname (V00043)'}
                  inputProps={{ maxLength: 32 }}
                />
              )}
            />
          </Grid>

          {/* Natural Person Fields - only show for person_nature 01/02 */}
          {['01', '02'].includes(watchedPersonNature) && (
            <>
              <Grid item xs={12} md={4}>
                <Controller
                  name="initials"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Initials"
                      helperText="Optional initials (max 3 characters)"
                      inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="natural_person.full_name_1"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name *"
                      error={!!errors.natural_person?.full_name_1}
                      helperText={errors.natural_person?.full_name_1?.message || 'First/given name (V00056)'}
                      inputProps={{ maxLength: 32 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="natural_person.full_name_2"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Middle Name"
                      helperText="Optional middle name (V00059)"
                      inputProps={{ maxLength: 32 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="natural_person.birth_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      InputLabelProps={{ shrink: true }}
                      helperText="Auto-derived from RSA ID or manual entry (V00067)"
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Contact Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="nationality_code"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={NATIONALITIES}
                  getOptionLabel={(option) => option.label}
                  value={NATIONALITIES.find(n => n.value === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.value || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nationality *"
                      error={!!errors.nationality_code}
                      helperText={errors.nationality_code?.message || 'Select nationality'}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="email_address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="email"
                  label="Email Address"
                  helperText="Optional email address"
                  inputProps={{ maxLength: 50 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="cell_phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Cell Phone"
                  helperText="Cell phone number"
                  inputProps={{ maxLength: 15 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="preferred_language"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Preferred Language</InputLabel>
                  <Select {...field} label="Preferred Language">
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="af">Afrikaans</MenuItem>
                    <MenuItem value="zu">isiZulu</MenuItem>
                    <MenuItem value="xh">isiXhosa</MenuItem>
                    <MenuItem value="st">Sesotho</MenuItem>
                    <MenuItem value="tn">Setswana</MenuItem>
                    <MenuItem value="ss">siSwati</MenuItem>
                    <MenuItem value="ve">Tshivenda</MenuItem>
                    <MenuItem value="ts">Xitsonga</MenuItem>
                    <MenuItem value="nr">isiNdebele</MenuItem>
                    <MenuItem value="nso">Sepedi</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderIdentificationDocuments = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Identification Documents
        </Typography>
        
        {aliasFields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name={`aliases.${index}.id_document_type_code`}
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.aliases?.[index]?.id_document_type_code}>
                      <InputLabel>ID Document Type *</InputLabel>
                      <Select {...field} label="ID Document Type *">
                        {ID_DOCUMENT_TYPES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {errors.aliases?.[index]?.id_document_type_code?.message || 'Select document type (V00001)'}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`aliases.${index}.id_document_number`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ID Document Number *"
                      error={!!errors.aliases?.[index]?.id_document_number}
                      helperText={errors.aliases?.[index]?.id_document_number?.message || 'Document number (V00013, V00017, V00018, V00019)'}
                      inputProps={{ maxLength: 13 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`aliases.${index}.country_of_issue`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Country of Issue"
                      defaultValue="ZA"
                      helperText="Country code (3 letters)"
                      inputProps={{ maxLength: 3 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name={`aliases.${index}.name_in_document`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name in Document"
                      helperText="Name as it appears in the document"
                      inputProps={{ maxLength: 200 }}
                    />
                  )}
                />
              </Grid>

              {aliasFields.length > 1 && (
                <Grid item xs={12}>
                  <Button
                    onClick={() => removeAlias(index)}
                    variant="outlined"
                    color="error"
                    size="small"
                  >
                    Remove Document
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        <Button
          onClick={() => appendAlias({
            id_document_type_code: '',
            id_document_number: '',
            country_of_issue: 'ZA',
            alias_status: '1',
            is_current: true
          })}
          variant="outlined"
        >
          Add Another Document
        </Button>
      </CardContent>
    </Card>
  );

  const renderAddressInformation = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Address Information
        </Typography>
        
        {addressFields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_type`}
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Address Type</InputLabel>
                      <Select {...field} label="Address Type">
                        <MenuItem value="street">Street/Physical Address</MenuItem>
                        <MenuItem value="postal">Postal Address</MenuItem>
                      </Select>
                      <FormHelperText>
                        Street addresses for physical location, postal for mail delivery
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.is_primary`}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Primary Address"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name={`addresses.${index}.address_line_1`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1 *"
                      error={!!errors.addresses?.[index]?.address_line_1}
                      helperText={errors.addresses?.[index]?.address_line_1?.message || 'Street number and name (V00095)'}
                      inputProps={{ maxLength: 35 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_2`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 2"
                      helperText="Building, apartment, etc."
                      inputProps={{ maxLength: 35 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_4`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Suburb"
                      helperText="Suburb or district"
                      inputProps={{ maxLength: 35 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.address_line_5`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City/Town"
                      helperText="City or town"
                      inputProps={{ maxLength: 35 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.postal_code`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                      error={!!errors.addresses?.[index]?.postal_code}
                      helperText={errors.addresses?.[index]?.postal_code?.message || '4-digit postal code (V00098, V00107)'}
                      inputProps={{ maxLength: 4, pattern: '[0-9]{4}' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.province_code`}
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={PROVINCES}
                      getOptionLabel={(option) => option.label}
                      value={PROVINCES.find(p => p.value === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Province"
                          helperText="Select province"
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {addressFields.length > 1 && (
                <Grid item xs={12}>
                  <Button
                    onClick={() => removeAddress(index)}
                    variant="outlined"
                    color="error"
                    size="small"
                  >
                    Remove Address
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        <Button
          onClick={() => appendAddress({
            address_type: 'postal',
            address_line_1: '',
            country_code: 'ZA',
            is_primary: false
          })}
          variant="outlined"
        >
          Add Another Address
        </Button>
      </CardContent>
    </Card>
  );

  const renderReviewAndSubmit = () => {
    const formData = getValues();
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Review Information
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Basic Information
            </Typography>
            <Typography><strong>Person Nature:</strong> {PERSON_NATURES.find(p => p.value === formData.person_nature)?.label}</Typography>
            <Typography><strong>Name:</strong> {formData.business_or_surname}</Typography>
            {formData.natural_person?.full_name_1 && (
              <Typography><strong>Full Name:</strong> {formData.natural_person.full_name_1} {formData.natural_person.full_name_2}</Typography>
            )}
            <Typography><strong>Nationality:</strong> {NATIONALITIES.find(n => n.value === formData.nationality_code)?.label}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Identification Documents
            </Typography>
            {formData.aliases.map((alias, index) => (
              <Box key={index} sx={{ ml: 2 }}>
                <Typography>
                  <strong>{ID_DOCUMENT_TYPES.find(t => t.value === alias.id_document_type_code)?.label}:</strong> {alias.id_document_number}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Addresses
            </Typography>
            {formData.addresses.map((address, index) => (
              <Box key={index} sx={{ ml: 2 }}>
                <Typography>
                  <strong>{address.address_type === 'street' ? 'Street' : 'Postal'} Address:</strong> {address.address_line_1}
                  {address.address_line_4 && `, ${address.address_line_4}`}
                  {address.postal_code && `, ${address.postal_code}`}
                </Typography>
              </Box>
            ))}
          </Box>

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Validation Errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Person registered successfully!
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderIdentificationDocuments();
      case 2:
        return renderAddressInformation();
      case 3:
        return renderReviewAndSubmit();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Person Registration
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Register a new person in the system. Complete all required fields based on the refactored specifications.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outlined"
            >
              Back
            </Button>

            <Box>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Registering...' : 'Register Person'}
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PersonRegistrationPage; 