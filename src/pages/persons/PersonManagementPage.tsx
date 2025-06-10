import { useState } from 'react';
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
  Checkbox,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { API_ENDPOINTS, api } from '../../config/api';
import { formatters, validators, createFormattedOnChange, extractGenderFromRSAId, extractBirthDateFromRSAId } from '../../config/validation';

// Types
interface PersonLookupForm {
  id_document_type_code: string;
  id_document_number: string;
}

interface PersonManagementForm {
  // Core Identity Fields
  business_or_surname: string;
  initials?: string;
  person_nature: string;
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
  
  // Natural Person Details
  natural_person?: {
    full_name_1: string;
    full_name_2?: string;
    full_name_3?: string;
    birth_date?: string;
    preferred_language_code?: string;
  };
  
  // ID Documents/Aliases
  aliases: Array<{
    id_document_type_code: string;
    id_document_number: string;
    country_of_issue: string;
    name_in_document?: string;
    alias_status: string;
    is_current: boolean;
  }>;
  
  // Addresses
  addresses: Array<{
    address_type: string;
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    address_line_4?: string;
    address_line_5?: string;
    postal_code?: string;
    country_code: string;
    province_code?: string;
    is_primary: boolean;
  }>;
}

interface ExistingPerson {
  id: string;
  business_or_surname: string;
  initials?: string;
  person_nature: string;
  nationality_code: string;
  email_address?: string;
  cell_phone?: string;
  is_active: boolean;
  created_at: string;
  natural_person?: {
    full_name_1?: string;
    full_name_2?: string;
    birth_date?: string;
  };
  aliases?: Array<{
    id: string;
    id_document_type_code: string;
    id_document_number: string;
    is_current: boolean;
  }>;
  addresses?: Array<{
    id: string;
    address_type: string;
    address_line_1: string;
    address_line_4?: string;
    postal_code?: string;
    is_primary: boolean;
  }>;
}

// Lookup data
// V00012 - Only RSA ID and Foreign ID allowed for person introduction
const ID_DOCUMENT_TYPES = [
  { value: '02', label: 'RSA ID (South African ID Document)' },
  { value: '03', label: 'Foreign ID (Foreign ID Document)' }
];

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

// Validation schemas
const lookupSchema = yup.object({
  id_document_type_code: yup.string().required('ID document type is required'),
  id_document_number: yup.string().required('ID document number is required')
    .min(3, 'ID number must be at least 3 characters')
});

const personSchema = yup.object({
  business_or_surname: yup.string().required('Person surname is mandatory (V00043)').max(32),
  person_nature: yup.string().required('Person nature is mandatory (V00034)'),
  nationality_code: yup.string().required('Person nationality is mandatory (V00040)'),
  
  // V00051 - Initials mandatory for natural persons
  initials: yup.string().when('person_nature', {
    is: (val: string) => ['01', '02'].includes(val),
    then: () => yup.string().required('Person initials are mandatory for natural persons (V00051)').max(3),
    otherwise: () => yup.string().max(3)
  }),
  
  natural_person: yup.object().when('person_nature', {
    is: (val: string) => ['01', '02'].includes(val),
    then: () => yup.object({
      full_name_1: yup.string().required('Natural person full name 1 is mandatory (V00056)').max(32),
      full_name_2: yup.string().max(32),
      full_name_3: yup.string().max(32),
    }),
    otherwise: () => yup.mixed().notRequired()
  }),
  
  // V00012 - Only RSA ID (02) and Foreign ID (03) allowed
  aliases: yup.array().of(
    yup.object({
      id_document_type_code: yup.string()
        .required('Alias identification type is mandatory (V00012)')
        .oneOf(['02', '03'], 'Only RSA ID and Foreign ID allowed for person introduction (V00012)'),
      id_document_number: yup.string()
        .required('Alias identification number is mandatory (V00013)')
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
            return /^\d+$/.test(value || '');
          }
          return true;
        }),
      country_of_issue: yup.string().required(),
      alias_status: yup.string().required()
    })
  ).min(1, 'At least one identification document is required'),
  
  addresses: yup.array().of(
    yup.object({
      address_type: yup.string().required(),
      address_line_1: yup.string().required('Person postal address line 1 is mandatory'),
      postal_code: yup.string().matches(/^\d{4}$/, 'Postal code must be exactly 4 digits').required('Person postal address postal code is mandatory')
    })
  ).min(1, 'At least one address is required')
});

const steps = [
  'ID Lookup',
  'Person Nature',
  'Basic Information', 
  'ID Documents',
  'Address Information',
  'Review & Submit'
];

const PersonManagementPage = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [personFound, setPersonFound] = useState<ExistingPerson | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState<boolean[]>(new Array(steps.length).fill(false));
  
  // Lookup form
  const lookupForm = useForm<PersonLookupForm>({
    resolver: yupResolver(lookupSchema),
    defaultValues: {
      id_document_type_code: '02', // Default to RSA ID
      id_document_number: ''
    }
  });

  // Main person form
  const personForm = useForm<PersonManagementForm>({
    resolver: yupResolver(personSchema),
    defaultValues: {
      business_or_surname: '',
      person_nature: '',
      nationality_code: 'ZA',
      preferred_language: 'en',
      aliases: [{
        id_document_type_code: '02',
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
    control: personForm.control,
    name: 'aliases'
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control: personForm.control,
    name: 'addresses'
  });

  // Watch form values
  const watchedPersonNature = personForm.watch('person_nature');

  // Step 1: ID Lookup functionality
  const performLookup = async (data: PersonLookupForm) => {
    setLookupLoading(true);
    
    try {
      // V00033 - Check if person exists first
      const existenceCheck = await api.get(API_ENDPOINTS.personCheckExistence(data.id_document_type_code, data.id_document_number));
      
      if (existenceCheck.exists) {
        // V00033 - Person already exists - ERROR and STOP
        setPersonFound(existenceCheck.person_summary);
        setIsNewPerson(false);
        markStepValid(0, false); // Mark as invalid to prevent progression
        return; // Do not proceed with lookup
      }
      
      const response = await fetch(`http://localhost:8000/api/v1/persons/search/by-id-number/${data.id_document_number}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const results = await response.json();
        
        if (results && results.length > 0) {
          // V00033 - Person already exists - ERROR and STOP
          const person = results[0];
          setPersonFound(person);
          setIsNewPerson(false);
          markStepValid(0, false); // Mark as invalid to prevent progression
          // Display error - do not advance steps
        } else {
          // Person not found - proceed with new registration
          setPersonFound(null);
          setIsNewPerson(true);
          setupNewPersonForm(data);
          markStepValid(0, true);
          setCurrentStep(1); // Go to person nature selection
        }
      }
    } catch (error) {
      console.error('Lookup failed:', error);
    } finally {
      setLookupLoading(false);
    }
  };



  const setupNewPersonForm = (lookupData: PersonLookupForm) => {
    // Pre-populate with lookup data
    const currentAliases = personForm.getValues('aliases');
    currentAliases[0] = {
      ...currentAliases[0],
      id_document_type_code: lookupData.id_document_type_code,
      id_document_number: lookupData.id_document_number
    };
    personForm.setValue('aliases', currentAliases);
    
    // Auto-derive data for RSA ID
    if (lookupData.id_document_type_code === '02' && lookupData.id_document_number.length === 13) {
      const derivedData = deriveFromRSAID(lookupData.id_document_number);
      if (derivedData.gender) {
        personForm.setValue('person_nature', derivedData.gender);
      }
      if (derivedData.birthDate && derivedData.birthDate !== 'Invalid Date') {
        personForm.setValue('natural_person.birth_date', derivedData.birthDate);
      }
    }
  };

  const deriveFromRSAID = (idNumber: string) => {
    if (idNumber.length !== 13) return { gender: null, birthDate: null };
    
    // V00065 - Extract birth date (YYMMDD) with century determination
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    
    // Century logic: if year > 21, assume 1900s, else 2000s (adjustable based on system date)
    const fullYear = year > 21 ? 1900 + year : 2000 + year;
    const birthDate = new Date(fullYear, month - 1, day);
    
    // V00034 - Extract gender from digits 7-10 (position 6-9 in 0-based indexing)
    const genderDigits = parseInt(idNumber.substring(6, 10));
    const gender = genderDigits > 4999 ? '01' : '02'; // Male: 5000-9999, Female: 0000-4999
    
    return {
      gender,
      birthDate: birthDate.toISOString().split('T')[0]
    };
  };

  // Step validation
  const markStepValid = (stepIndex: number, isValid: boolean) => {
    const newValidation = [...stepValidation];
    newValidation[stepIndex] = isValid;
    setStepValidation(newValidation);
  };

  const validateCurrentStep = async () => {
    const currentStepData = getCurrentStepData();
    
    try {
      if (currentStep === 0) {
        await lookupForm.trigger();
        const isValid = lookupForm.formState.isValid;
        markStepValid(0, isValid);
        return isValid;
      } else {
        // Validate current step fields
        const isValid = await personForm.trigger(currentStepData.fields as any);
        markStepValid(currentStep, isValid);
        return isValid;
      }
    } catch (error) {
      markStepValid(currentStep, false);
      return false;
    }
  };

  const getCurrentStepData = () => {
    const stepData = [
      { fields: ['id_document_type_code', 'id_document_number'] },
      { fields: ['person_nature'] },
      { fields: ['business_or_surname', 'nationality_code', 'natural_person'] },
      { fields: ['aliases'] },
      { fields: ['addresses'] },
      { fields: [] } // Review step
    ];
    
    return stepData[currentStep];
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid) {
      if (currentStep === 0) {
        // Perform lookup
        const lookupData = lookupForm.getValues();
        await performLookup(lookupData);
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    
    try {
      const formData = personForm.getValues();
      const url = isNewPerson ? '/api/v1/persons/' : `/api/v1/persons/${personFound?.id}`;
      const method = isNewPerson ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Success - redirect or show success message
        console.log('Person saved successfully');
      }
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setPersonFound(null);
    setIsNewPerson(false);
    setStepValidation(new Array(steps.length).fill(false));
    lookupForm.reset();
    personForm.reset();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderLookupStep();
      case 1:
        return renderPersonNatureStep();
      case 2:
        return renderBasicInformationStep();
      case 3:
        return renderIdDocumentsStep();
      case 4:
        return renderAddressStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderLookupStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {personFound ? 'Person Found' : 'ID Document Lookup'}
        </Typography>
        
        {personFound ? (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <strong>V00033 - This person already exists</strong>
              <br />
              Person introduction cannot proceed. Use search function to find and manage existing person records.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  <strong>Existing Person:</strong> {personFound.business_or_surname}
                  {personFound.natural_person?.full_name_1 && 
                    ` - ${personFound.natural_person.full_name_1}`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {PERSON_NATURES.find(n => n.value === personFound.person_nature)?.label}
                </Typography>
                <Chip 
                  label={personFound.is_active ? 'Active' : 'Inactive'} 
                  size="small" 
                  color={personFound.is_active ? 'success' : 'error'} 
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <form onSubmit={lookupForm.handleSubmit(performLookup)}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter ID document details to search for existing person or register new person.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="id_document_type_code"
                  control={lookupForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!lookupForm.formState.errors.id_document_type_code}>
                      <InputLabel>ID Document Type *</InputLabel>
                      <Select {...field} label="ID Document Type *">
                        {ID_DOCUMENT_TYPES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {lookupForm.formState.errors.id_document_type_code?.message || 'Select identification document type (V00001)'}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="id_document_number"
                  control={lookupForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ID Document Number *"
                      placeholder="Enter ID document number"
                      error={!!lookupForm.formState.errors.id_document_number}
                      helperText={lookupForm.formState.errors.id_document_number?.message || 'Enter the identification number (V00013)'}
                      InputProps={{
                        endAdornment: field.value && (
                          <InputAdornment position="end">
                            <IconButton onClick={() => lookupForm.setValue('id_document_number', '')} size="small">
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={lookupLoading}
                  startIcon={<SearchIcon />}
                  sx={{ height: '56px' }}
                >
                  {lookupLoading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </CardContent>
    </Card>
  );

  const renderPersonNatureStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Person Nature Selection
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This person was not found in the system. Please select the type of person/entity to register.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="person_nature"
              control={personForm.control}
              render={({ field }) => (
                <FormControl fullWidth error={!!personForm.formState.errors.person_nature}>
                  <InputLabel>Person Nature *</InputLabel>
                  <Select {...field} label="Person Nature *">
                    {PERSON_NATURES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {personForm.formState.errors.person_nature?.message || 'Select the type of person/entity (V00034)'}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {watchedPersonNature && (
            <Grid item xs={12}>
              <Alert severity="success">
                Selected: <strong>{PERSON_NATURES.find(n => n.value === watchedPersonNature)?.label}</strong>
                <br />
                {['01', '02'].includes(watchedPersonNature) ? 
                  'Natural person fields will be available in the next step.' :
                  'Organization fields will be available in the next step.'
                }
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBasicInformationStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        <Grid container spacing={3}>
          {/* Business/Surname */}
          <Grid item xs={12} md={6}>
            <Controller
              name="business_or_surname"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={['01', '02'].includes(watchedPersonNature) ? 'Surname *' : 'Business Name *'}
                  error={!!personForm.formState.errors.business_or_surname}
                  helperText={personForm.formState.errors.business_or_surname?.message || 'Business name or surname (V00043)'}
                  inputProps={{ maxLength: 32 }}
                />
              )}
            />
          </Grid>

                        {/* Initials - MANDATORY for natural persons per V00051 */}
          {['01', '02'].includes(watchedPersonNature) && (
            <Grid item xs={12} md={6}>
              <Controller
                name="initials"
                control={personForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Initials *"
                    error={!!personForm.formState.errors.initials}
                    helperText={personForm.formState.errors.initials?.message || 'Initials are mandatory for natural persons (V00051)'}
                    inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                  />
                )}
              />
            </Grid>
          )}

          {/* Nationality */}
          <Grid item xs={12} md={6}>
            <Controller
              name="nationality_code"
              control={personForm.control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Nationality *</InputLabel>
                  <Select {...field} label="Nationality *">
                    <MenuItem value="ZA">South African</MenuItem>
                    <MenuItem value="US">United States</MenuItem>
                    <MenuItem value="GB">United Kingdom</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          {/* Natural Person Fields */}
          {['01', '02'].includes(watchedPersonNature) && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Personal Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="natural_person.full_name_1"
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name *"
                      error={!!personForm.formState.errors.natural_person?.full_name_1}
                      helperText={personForm.formState.errors.natural_person?.full_name_1?.message || 'First/given name (V00056)'}
                      inputProps={{ maxLength: 32 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="natural_person.full_name_2"
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Middle Name"
                      helperText="Middle name (optional)"
                      inputProps={{ maxLength: 32 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="natural_person.birth_date"
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      InputLabelProps={{ shrink: true }}
                      helperText="Date of birth (auto-derived from RSA ID)"
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="email_address"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="email"
                  label="Email Address"
                  helperText="Email address (optional)"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="cell_phone"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Cell Phone"
                  helperText="Mobile phone number (optional)"
                />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderIdDocumentsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ID Documents / Aliases
        </Typography>
        
        {aliasFields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Controller
                  name={`aliases.${index}.id_document_type_code`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>ID Type</InputLabel>
                      <Select {...field} label="ID Type" disabled={index === 0}>
                        {ID_DOCUMENT_TYPES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`aliases.${index}.id_document_number`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="ID Number"
                      disabled={index === 0}
                      helperText={index === 0 ? 'From lookup step' : 'Additional ID document'}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Controller
                  name={`aliases.${index}.is_current`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Current"
                    />
                  )}
                />
              </Grid>

              {index > 0 && (
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeAlias(index)}
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        <Button
          variant="outlined"
          onClick={() => appendAlias({
            id_document_type_code: '13',
            id_document_number: '',
            country_of_issue: 'ZA',
            alias_status: '1',
            is_current: false
          })}
          startIcon={<PersonAddIcon />}
        >
          Add Additional ID Document
        </Button>
      </CardContent>
    </Card>
  );

  const renderAddressStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Address Information
        </Typography>
        
        {addressFields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.address_type`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Address Type</InputLabel>
                      <Select {...field} label="Address Type">
                        <MenuItem value="street">Street/Physical</MenuItem>
                        <MenuItem value="postal">Postal</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_1`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1 *"
                      helperText="Street address or postal address line 1"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Controller
                  name={`addresses.${index}.is_primary`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Primary"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.address_line_4`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Suburb"
                      helperText="Suburb or area"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name={`addresses.${index}.postal_code`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                      helperText="4-digit postal code (V00098)"
                      inputProps={{ maxLength: 4 }}
                    />
                  )}
                />
              </Grid>

              {index > 0 && (
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeAddress(index)}
                    fullWidth
                  >
                    Remove Address
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        <Button
          variant="outlined"
          onClick={() => appendAddress({
            address_type: 'postal',
            address_line_1: '',
            country_code: 'ZA',
            is_primary: false
          })}
        >
          Add Additional Address
        </Button>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {isNewPerson ? 'Ready to create new person record' : `Ready to update person: ${personFound?.business_or_surname}`}
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Summary</Typography>
            <Typography>Person Nature: {PERSON_NATURES.find(n => n.value === watchedPersonNature)?.label}</Typography>
            <Typography>Name: {personForm.watch('business_or_surname')}</Typography>
            <Typography>ID Documents: {aliasFields.length}</Typography>
            <Typography>Addresses: {addressFields.length}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Person Management
        </Typography>
        
        <Button
          variant="outlined"
          onClick={resetForm}
          startIcon={<ClearIcon />}
        >
          Start Over
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Search for existing persons or register new persons in the system.
      </Typography>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={stepValidation[index]}>
              <StepLabel>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
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
            {currentStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={lookupLoading}
              >
                {currentStep === 0 ? 'Search' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitLoading}
                startIcon={isNewPerson ? <PersonAddIcon /> : <EditIcon />}
              >
                {submitLoading ? 'Saving...' : (isNewPerson ? 'Create Person' : 'Update Person')}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PersonManagementPage; 