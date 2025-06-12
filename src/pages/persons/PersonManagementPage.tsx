/**
 * Person Management Page - Multi-step registration/editing
 * Implements complete person lifecycle management with validation
 */

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
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import lookupService, { Province, PhoneCode } from '../../config/lookupService';

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
  home_phone?: string;
  work_phone?: string;
  cell_phone_country_code?: string;
  cell_phone?: string;
  fax_phone?: string;
  
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
    id_document_expiry_date?: string;
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
// Core ID document types as specified
const ID_DOCUMENT_TYPES = [
  { value: '01', label: 'TRN (Traffic Register Number)', format: 'numeric', length: 13, requiresExpiry: false },
  { value: '02', label: 'RSA ID (South African ID Document)', format: 'numeric', length: 13, requiresExpiry: false },
  { value: '03', label: 'Foreign ID (Foreign ID Document)', format: 'alphanumeric', length: 'variable', requiresExpiry: true },
  { value: '05', label: 'Passport Number', format: 'alphanumeric', length: 'variable', requiresExpiry: true }
];

const PERSON_NATURES = [
  { value: '01', label: 'Male (Natural Person)', disabled: false },
  { value: '02', label: 'Female (Natural Person)', disabled: false },
  { value: '03', label: 'Company/Corporation', disabled: true },
  { value: '10', label: 'Close Corporation', disabled: true },
  { value: '11', label: 'Trust', disabled: true },
  { value: '12', label: 'Partnership', disabled: true },
  { value: '13', label: 'Sole Proprietorship', disabled: true },
  { value: '14', label: 'Association', disabled: true },
  { value: '15', label: 'Cooperative', disabled: true },
  { value: '16', label: 'Non-Profit Organization', disabled: true },
  { value: '17', label: 'Other Organization', disabled: true }
];

// Document validation functions
const validateCheckDigit = (idNumber: string): boolean => {
  if (!idNumber || idNumber.length !== 13) return false;
  if (!/^\d{13}$/.test(idNumber)) return false;
  
  // Calculate checksum using Luhn algorithm for RSA ID, TRN, BRN
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
};

const validatePassport = (passportNumber: string): boolean => {
  if (!passportNumber) return false;
  const cleaned = passportNumber.replace(/\s/g, '');
  return cleaned.length >= 6 && cleaned.length <= 12 && /^[A-Za-z0-9]+$/.test(cleaned);
};



const validateDocumentNumber = (docType: string, docNumber: string): boolean => {
  switch (docType) {
    case '01': // TRN
    case '02': // RSA ID
      return validateCheckDigit(docNumber);
    case '05': // Passport
      return validatePassport(docNumber);
    case '03': // Foreign ID
      return docNumber.length >= 4;
    default:
      return true;
  }
};

// Validation schemas
const lookupSchema = yup.object({
  id_document_type_code: yup.string().required('ID document type is required'),
  id_document_number: yup.string().required('ID document number is required')
    .min(3, 'ID number must be at least 3 characters')
    .test('document-validation', 'Invalid document number format', function(value) {
      const { id_document_type_code } = this.parent;
      if (value && id_document_type_code) {
        return validateDocumentNumber(id_document_type_code, value);
      }
      return true;
    })
});

const personSchema = yup.object({
  business_or_surname: yup.string().required('Person surname is mandatory (V00043)').max(32),
  person_nature: yup.string().required('Person nature is mandatory (V00034)'),
  nationality_code: yup.string().required('Person nationality is mandatory (V00040)'),
  
  // V00051 - Initials mandatory for natural persons
  initials: yup.string()
    .max(3, 'Maximum 3 characters')
    .matches(/^[A-Z]*$/, 'Initials must be uppercase letters only')
    .when('person_nature', {
      is: (val: string) => ['01', '02'].includes(val),
      then: () => yup.string().required('Person initials are mandatory for natural persons (V00051)'),
      otherwise: () => yup.string().test(
        'no-initials-for-organizations', 
        'Initials only applicable to natural persons (V00001)', 
        function(value) {
          const personNature = this.parent.person_nature;
          if (value && personNature && !['01', '02'].includes(personNature)) {
            return false;
          }
          return true;
        }
      )
    }),
  
  natural_person: yup.object().when('person_nature', {
    is: (val: string) => ['01', '02'].includes(val),
    then: () => yup.object({
      full_name_1: yup.string().required('Natural person full name 1 is mandatory (V00056)').max(32),
      full_name_2: yup.string().max(32),
      full_name_3: yup.string().max(32),
      birth_date: yup.string().test('min-date', 'Date must be after 1840-01-01', function(value) {
        if (!value) return true;
        return value >= '1840-01-01';
      })
    }),
    otherwise: () => yup.mixed().notRequired()
  }),

  // Phone number validation
  email_address: yup.string()
    .max(50, 'Maximum 50 characters')
    .email('Invalid email format'),
  home_phone: yup.string()
    .max(20, 'Maximum 20 characters'),
  work_phone: yup.string()
    .max(20, 'Maximum 20 characters'),
  cell_phone_country_code: yup.string()
    .matches(/^\+\d{1,4}$/, 'Invalid country code format'),
  cell_phone: yup.string()
    .max(15, 'Maximum 15 characters')
    .matches(/^\d*$/, 'Cell phone must contain only digits')
    .when('cell_phone_country_code', {
      is: (val: string) => !!val,
      then: () => yup.string().required('Cell phone number required when country code is provided'),
      otherwise: () => yup.string()
    }),
  fax_phone: yup.string()
    .max(20, 'Maximum 20 characters'),
  
  // Extended ID document validation for all types
  aliases: yup.array().of(
    yup.object({
      id_document_type_code: yup.string()
        .required('Alias identification type is mandatory (V00012)')
        .oneOf(['01', '02', '03', '05'], 'Invalid ID document type'),
      id_document_number: yup.string()
        .required('Alias identification number is mandatory (V00013)')
        .test('document-format-validation', 'Invalid document number format', function(value) {
          const { id_document_type_code } = this.parent;
          if (!value || !id_document_type_code) return false;
          
          // Get document type info
          const docType = ID_DOCUMENT_TYPES.find(dt => dt.value === id_document_type_code);
          if (!docType) return false;
          
          // Validate based on document type
          if (docType.format === 'numeric' && docType.length === 13) {
            // TRN, RSA ID, BRN validation
            if (value.length !== 13) {
              return this.createError({message: `${docType.label} must be exactly 13 characters (V00018)`});
            }
            if (!/^\d+$/.test(value)) {
              return this.createError({message: `${docType.label} must be numeric only (V00017)`});
            }
            if (!validateCheckDigit(value)) {
              return this.createError({message: `Invalid ${docType.label} check digit (V00019)`});
            }
                     } else if (id_document_type_code === '05') {
             // Passport validation
             if (!validatePassport(value)) {
               return this.createError({message: 'Passport number must be 6-12 alphanumeric characters'});
             }
           } else if (id_document_type_code === '03') {
            // Foreign ID validation
            if (value.length < 4) {
              return this.createError({message: 'Foreign ID must be at least 4 characters'});
            }
          }
          
          return true;
        }),
      country_of_issue: yup.string().required(),
      alias_status: yup.string().required(),
      id_document_expiry_date: yup.string()
        .test('future-date', 'Expiry date must be in the future', function(value) {
          if (!value) return true;
          return new Date(value) > new Date();
        })
        .test('expiry-required', 'Expiry date validation', function(value) {
          const { id_document_type_code } = this.parent;
          const docType = ID_DOCUMENT_TYPES.find(dt => dt.value === id_document_type_code);
          
          if (docType?.requiresExpiry && !value) {
            return this.createError({message: `Expiry date is required for ${docType.label}`});
          }
          
          
          
          return true;
        })
    })
  ).min(1, 'At least one identification document is required'),
  
  addresses: yup.array().of(
    yup.object({
      address_type: yup.string().required(),
      address_line_1: yup.string()
        .max(35, 'Maximum 35 characters')
        .required('Address line 1 is mandatory'),
      address_line_2: yup.string().max(35, 'Maximum 35 characters'),
      address_line_3: yup.string().max(35, 'Maximum 35 characters'),
      address_line_4: yup.string().max(35, 'Maximum 35 characters'),
      address_line_5: yup.string().max(35, 'Maximum 35 characters'),
      postal_code: yup.string()
        .matches(/^\d{4}$/, 'Postal code must be exactly 4 digits')
        .required('Postal code is mandatory'),
      country_code: yup.string().required(),
      province_code: yup.string()
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
  // Auth
  const { accessToken } = useAuth();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [personFound, setPersonFound] = useState<ExistingPerson | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState<boolean[]>(new Array(steps.length).fill(false));
  
  // Lookup data state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);
  const [lookupDataLoading, setLookupDataLoading] = useState(true);
  
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
      email_address: '',
      home_phone: '',
      work_phone: '',
      cell_phone_country_code: '',
      cell_phone: '',
      fax_phone: '',
      natural_person: {
        full_name_1: '',
        full_name_2: '',
        full_name_3: '',
        birth_date: '',
        preferred_language_code: 'en'
      },
      aliases: [{
        id_document_type_code: '02',
        id_document_number: '',
        country_of_issue: 'ZA',
        alias_status: '1',
        is_current: true,
        id_document_expiry_date: ''
      }],
      addresses: [{
        address_type: 'street',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        address_line_4: '',
        address_line_5: '',
        postal_code: '',
        country_code: 'ZA',
        province_code: '',
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

  // Load lookup data on component mount
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        setLookupDataLoading(true);
        const lookupData = await lookupService.getAllLookups();
        
        // Ensure we have arrays and use fallback if empty
        const provincesArray = Array.isArray(lookupData.provinces) && lookupData.provinces.length > 0 
          ? lookupData.provinces 
          : [
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
            
        const phoneCodesArray = Array.isArray(lookupData.phone_codes) && lookupData.phone_codes.length > 0
          ? lookupData.phone_codes
          : [
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
        
        setProvinces(provincesArray);
        setPhoneCodes(phoneCodesArray);
        
        console.log('Loaded lookup data:', { 
          provinces: provincesArray.length, 
          phoneCodes: phoneCodesArray.length,
          usingFallbackProvinces: !Array.isArray(lookupData.provinces) || lookupData.provinces.length === 0,
          usingFallbackPhoneCodes: !Array.isArray(lookupData.phone_codes) || lookupData.phone_codes.length === 0
        });
      } catch (error) {
        console.error('Failed to load lookup data:', error);
        // Use fallback data
        const fallbackProvinces = [
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
        const fallbackPhoneCodes = [
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
        
        setProvinces(fallbackProvinces);
        setPhoneCodes(fallbackPhoneCodes);
        
        console.log('Using fallback data due to error:', { 
          provinces: fallbackProvinces.length, 
          phoneCodes: fallbackPhoneCodes.length 
        });
      } finally {
        setLookupDataLoading(false);
      }
    };

    loadLookupData();
  }, []);

  // Step 1: ID Lookup functionality
  const performLookup = async (data: PersonLookupForm) => {
    setLookupLoading(true);
    
    try {
      // V00033 - Check if person exists first
      const existenceResponse = await fetch(API_ENDPOINTS.personCheckExistence(data.id_document_type_code, data.id_document_number), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (existenceResponse.ok) {
        const existenceCheck = await existenceResponse.json();
        
        if (existenceCheck.exists) {
          // V00033 - Person already exists - ERROR and STOP
          setPersonFound(existenceCheck.person_summary);
          setIsNewPerson(false);
          markStepValid(0, false); // Mark as invalid to prevent progression
          return; // Do not proceed with lookup
        }
      }
      
      const response = await fetch(API_ENDPOINTS.personSearchById(data.id_document_number), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
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
    
    // Validate extracted values
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { gender: null, birthDate: null };
    }
    
    // Century logic: if year > 21, assume 1900s, else 2000s (adjustable based on system date)
    const fullYear = year > 21 ? 1900 + year : 2000 + year;
    
    // Create date string directly to avoid timezone issues
    const birthDateString = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // V00034 - Extract gender from digits 7-10 (position 6-9 in 0-based indexing)
    const genderDigits = parseInt(idNumber.substring(6, 10));
    const gender = genderDigits > 4999 ? '01' : '02'; // Male: 5000-9999, Female: 0000-4999
    
    return {
      gender,
      birthDate: birthDateString
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
        // For step 1 (person nature), we only need to validate person_nature
        if (currentStep === 1) {
          const isValid = await personForm.trigger(['person_nature']);
          markStepValid(currentStep, isValid);
          return isValid;
        } else {
          // Validate current step fields
          const isValid = await personForm.trigger(currentStepData.fields as any);
          markStepValid(currentStep, isValid);
          return isValid;
        }
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
      { fields: ['business_or_surname', 'nationality_code', 'initials', 'email_address', 'home_phone', 'work_phone', 'cell_phone_country_code', 'cell_phone', 'fax_phone', 'natural_person.full_name_1', 'natural_person.full_name_2', 'natural_person.full_name_3', 'natural_person.birth_date'] },
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
      
      // Clean up empty date fields to prevent backend validation errors
      if (formData.aliases) {
        formData.aliases = formData.aliases.map(alias => ({
          ...alias,
          // Remove empty expiry date or convert to undefined
          id_document_expiry_date: alias.id_document_expiry_date?.trim() || undefined
        }));
      }
      
      const url = isNewPerson ? `${API_BASE_URL}/api/v1/persons/` : `${API_BASE_URL}/api/v1/persons/${personFound?.id}`;
      const method = isNewPerson ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Success - redirect or show success message
        console.log('Person saved successfully');
      } else {
        const errorData = await response.json();
        console.error('Submit failed:', errorData);
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
    setIsEditMode(false);
    setEditingPersonId(null);
    setStepValidation(new Array(steps.length).fill(false));
    lookupForm.reset();
    personForm.reset();
  };

  // Handler functions for edit/review functionality
  const handleViewPerson = (person: ExistingPerson) => {
    // TODO: Open a dialog or navigate to a view page showing full person details
    console.log('Viewing person:', person);
    alert(`Viewing details for: ${person.business_or_surname}\nFeature coming soon!`);
  };

  const handleEditPerson = (person: ExistingPerson) => {
    console.log('Starting edit for person:', person);
    
    // Set edit mode
    setIsEditMode(true);
    setEditingPersonId(person.id);
    
    // Pre-populate form with existing person data for editing
    const personData: PersonManagementForm = {
      business_or_surname: person.business_or_surname || '',
      initials: person.initials || '',
      person_nature: person.person_nature || '',
      nationality_code: person.nationality_code || 'ZA',
      preferred_language: 'en', // Default
      email_address: person.email_address || '',
      home_phone: '', // Not available in summary
      work_phone: '', // Not available in summary
      cell_phone_country_code: '+27', // Default for SA
      cell_phone: person.cell_phone || '',
      fax_phone: '', // Not available in summary
      natural_person: person.natural_person ? {
        full_name_1: person.natural_person.full_name_1 || '',
        full_name_2: person.natural_person.full_name_2 || '',
        full_name_3: '', // Not in summary
        birth_date: person.natural_person.birth_date || '',
        preferred_language_code: 'en' // Default
      } : {
        full_name_1: '',
        full_name_2: '',
        full_name_3: '',
        birth_date: '',
        preferred_language_code: 'en'
      },
      aliases: person.aliases?.map(alias => ({
        id_document_type_code: alias.id_document_type_code || '02',
        id_document_number: alias.id_document_number || '',
        country_of_issue: 'ZA', // Default, would need to fetch from backend
        name_in_document: '', // Not in summary
        alias_status: '1', // Default active
        is_current: alias.is_current !== undefined ? alias.is_current : true,
        id_document_expiry_date: '' // Not in summary
      })) || [{
        id_document_type_code: '02',
        id_document_number: '',
        country_of_issue: 'ZA',
        name_in_document: '',
        alias_status: '1',
        is_current: true,
        id_document_expiry_date: ''
      }],
      addresses: person.addresses?.map(address => ({
        address_type: address.address_type || 'street',
        address_line_1: address.address_line_1 || '',
        address_line_2: '', // Not in summary
        address_line_3: '', // Not in summary
        address_line_4: address.address_line_4 || '',
        address_line_5: '', // Not in summary
        postal_code: address.postal_code || '',
        country_code: 'ZA', // Default
        province_code: '', // Not in summary
        is_primary: address.is_primary !== undefined ? address.is_primary : true
      })) || [{
        address_type: 'street',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        address_line_4: '',
        address_line_5: '',
        postal_code: '',
        country_code: 'ZA',
        province_code: '',
        is_primary: true
      }]
    };

    console.log('Populating form with data:', personData);
    
    // Reset form with existing data
    personForm.reset(personData);
    
    // Use setTimeout to ensure the form is populated before moving steps
    setTimeout(() => {
      // Skip to step 2 (Basic Information) since we're editing
      setCurrentStep(2);
      setPersonFound(null); // Hide the found person display
      console.log('Form populated and moved to step 2');
    }, 100);
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
              
              {/* Edit/Review Actions */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewPerson(personFound)}
                  >
                    Review Details
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<EditIcon />}
                    onClick={() => handleEditPerson(personFound)}
                  >
                    Edit Person
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => setPersonFound(null)}
                  >
                    Search Another
                  </Button>
                </Box>
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
                  render={({ field }) => {
                    const selectedType = lookupForm.watch('id_document_type_code');
                    const isRSAID = selectedType === '02';
                    const currentValue = field.value || '';
                    
                    // Real-time validation feedback for RSA ID
                    let validationColor = 'default';
                    let validationIcon = null;
                    let helperText = lookupForm.formState.errors.id_document_number?.message;
                    
                    if (isRSAID && currentValue.length === 13) {
                      const isValid = validateCheckDigit(currentValue);
                      validationColor = isValid ? 'success' : 'error';
                      validationIcon = isValid ? '✓' : '✗';
                      if (!helperText) {
                        helperText = isValid ? 'Valid RSA ID number' : 'Invalid RSA ID - check digit validation failed';
                      }
                    } else if (!helperText) {
                      helperText = isRSAID ? 'RSA ID must be 13 digits (numbers only) - V00017, V00018' : 'Enter the identification number (V00013)';
                    }
                    
                    return (
                      <TextField
                        {...field}
                        fullWidth
                        label="ID Document Number *"
                        placeholder={isRSAID ? "Enter 13-digit RSA ID number" : "Enter ID document number"}
                        error={!!lookupForm.formState.errors.id_document_number}
                        helperText={helperText}

                        inputProps={{
                          maxLength: isRSAID ? 13 : undefined,
                          pattern: isRSAID ? '[0-9]*' : undefined,
                          inputMode: isRSAID ? 'numeric' : 'text'
                        }}
                        onChange={(e) => {
                          let value = e.target.value;
                          // For RSA ID, only allow numbers
                          if (isRSAID) {
                            value = value.replace(/[^0-9]/g, '');
                            if (value.length > 13) {
                              value = value.substring(0, 13);
                            }
                          }
                          field.onChange(value);
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {validationIcon && (
                                <span style={{ 
                                  color: validationColor === 'success' ? 'green' : 'red',
                                  marginRight: '8px',
                                  fontWeight: 'bold'
                                }}>
                                  {validationIcon}
                                </span>
                              )}
                              {field.value && (
                                <IconButton onClick={() => lookupForm.setValue('id_document_number', '')} size="small">
                                  <ClearIcon />
                                </IconButton>
                              )}
                            </InputAdornment>
                          )
                        }}
                      />
                    );
                  }}
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
        
        {!isEditMode ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            This person was not found in the system. Please select the type of person/entity to register.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Edit Mode:</strong> Person nature cannot be changed for existing persons.
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="person_nature"
              control={personForm.control}
              render={({ field }) => (
                <FormControl fullWidth error={!!personForm.formState.errors.person_nature}>
                  <InputLabel>Person Nature *</InputLabel>
                  <Select {...field} label="Person Nature *" disabled={isEditMode}>
                    {PERSON_NATURES.map((option) => (
                      <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                        {option.disabled && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (Coming Soon)
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {isEditMode ? 'Person nature cannot be changed' : 
                     personForm.formState.errors.person_nature?.message || 'Select the type of person/entity (V00034)'}
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
          {isEditMode ? 'Edit Person Information' : 'Basic Information'}
        </Typography>
        
        {isEditMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Edit Mode:</strong> You are editing an existing person record. 
            Some fields like person nature cannot be changed.
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Identity Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Identity Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="business_or_surname"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  fullWidth
                  label={['01', '02'].includes(watchedPersonNature) ? 'Surname *' : 'Business Name *'}
                  error={!!personForm.formState.errors.business_or_surname}
                  helperText={personForm.formState.errors.business_or_surname?.message || 'Business name or surname (V00043) - Auto-converted to UPPERCASE'}
                  inputProps={{ maxLength: 32, style: { textTransform: 'uppercase' } }}
                />
              )}
            />
          </Grid>

          {['01', '02'].includes(watchedPersonNature) ? (
            <Grid item xs={12} md={3}>
              <Controller
                name="initials"
                control={personForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    fullWidth
                    label="Initials *"
                    error={!!personForm.formState.errors.initials}
                    helperText={personForm.formState.errors.initials?.message || 'Required for natural persons (V00051)'}
                    inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                  />
                )}
              />
            </Grid>
          ) : (
            <Grid item xs={12} md={3} />
          )}

          <Grid item xs={12} md={3}>
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

          {/* Natural Person Details */}
          {['01', '02'].includes(watchedPersonNature) && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 2 }}>
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
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="First Name *"
                      error={!!personForm.formState.errors.natural_person?.full_name_1}
                      helperText={personForm.formState.errors.natural_person?.full_name_1?.message || 'First/given name (V00056)'}
                      inputProps={{ maxLength: 32, style: { textTransform: 'uppercase' } }}
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
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="Middle Name"
                      helperText="Middle name (optional)"
                      inputProps={{ maxLength: 32, style: { textTransform: 'uppercase' } }}
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
                      helperText="Auto-derived from RSA ID"
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 2 }}>
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
                  error={!!personForm.formState.errors.email_address}
                  helperText={personForm.formState.errors.email_address?.message || "Email address (optional, max 50 chars)"}
                  inputProps={{ maxLength: 50 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="home_phone"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Home Phone"
                  error={!!personForm.formState.errors.home_phone}
                  helperText={personForm.formState.errors.home_phone?.message || "Home phone number (optional)"}
                  inputProps={{ maxLength: 20 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="work_phone"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Work Phone"
                  error={!!personForm.formState.errors.work_phone}
                  helperText={personForm.formState.errors.work_phone?.message || "Work phone number (optional)"}
                  inputProps={{ maxLength: 20 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="fax_phone"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Fax Phone"
                  error={!!personForm.formState.errors.fax_phone}
                  helperText={personForm.formState.errors.fax_phone?.message || "Fax phone number (optional)"}
                  inputProps={{ maxLength: 20 }}
                />
              )}
            />
          </Grid>

          {/* Cell Phone Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mt: 1 }}>
              Cell Phone (International Format)
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="cell_phone_country_code"
              control={personForm.control}
              render={({ field }) => (
                <FormControl fullWidth error={!!personForm.formState.errors.cell_phone_country_code}>
                  <Autocomplete
                    {...field}
                    options={Array.isArray(phoneCodes) ? phoneCodes : []}
                    getOptionLabel={(option) => `${option.phone_code} (${option.country_name})`}
                    value={Array.isArray(phoneCodes) ? phoneCodes.find(code => code.phone_code === field.value) || null : null}
                    onChange={(_, newValue) => field.onChange(newValue?.phone_code || '')}
                    loading={lookupDataLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country Code"
                        error={!!personForm.formState.errors.cell_phone_country_code}
                        helperText={personForm.formState.errors.cell_phone_country_code?.message || "Select country code"}
                      />
                    )}
                  />
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Controller
              name="cell_phone"
              control={personForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Cell Phone Number"
                  error={!!personForm.formState.errors.cell_phone}
                  helperText={personForm.formState.errors.cell_phone?.message || "Cell phone number (digits only, max 15 chars)"}
                  inputProps={{ 
                    maxLength: 15,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
                  }}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
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
        
        {isEditMode && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Edit Mode:</strong> Primary ID document cannot be changed as it's used for identification.
            You can add additional ID documents if needed.
          </Alert>
        )}
        
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
                      <Select {...field} label="ID Type" disabled={index === 0 || (isEditMode && index === 0)}>
                        {ID_DOCUMENT_TYPES.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {index === 0 && isEditMode && (
                        <FormHelperText>Primary ID - Cannot be changed</FormHelperText>
                      )}
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
                      disabled={index === 0 || (isEditMode && index === 0)}
                      helperText={
                        index === 0 && isEditMode ? 'Primary ID - Cannot be changed' :
                        index === 0 ? 'From lookup step' : 'Additional ID document'
                      }
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

              {/* Expiry Date for Foreign Documents */}
              {personForm.watch(`aliases.${index}.id_document_type_code`) === '03' && (
                <Grid item xs={12} md={3}>
                  <Controller
                    name={`aliases.${index}.id_document_expiry_date`}
                    control={personForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="date"
                        label="Expiry Date *"
                        InputLabelProps={{ shrink: true }}
                        error={!!personForm.formState.errors.aliases?.[index]?.id_document_expiry_date}
                        helperText={
                          personForm.formState.errors.aliases?.[index]?.id_document_expiry_date?.message || 
                          "Required for foreign documents"
                        }
                      />
                    )}
                  />
                </Grid>
              )}

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
          <Box key={field.id} sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Grid container spacing={3}>
              {/* Address Header */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {index === 0 ? 'Primary Address' : `Additional Address ${index}`}
                </Typography>
              </Grid>

              {/* Address Type and Primary Flag */}
              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_type`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Address Type *</InputLabel>
                      <Select {...field} label="Address Type *">
                        <MenuItem value="street">Street/Physical Address</MenuItem>
                        <MenuItem value="postal">Postal Address</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.is_primary`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Set as Primary Address"
                      sx={{ mt: 2 }}
                    />
                  )}
                />
              </Grid>

              {/* Main Address Line */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mt: 1 }}>
                  Address Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <Controller
                  name={`addresses.${index}.address_line_1`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="Street Address / Address Line 1 *"
                      error={!!personForm.formState.errors.addresses?.[index]?.address_line_1}
                      helperText={
                        personForm.formState.errors.addresses?.[index]?.address_line_1?.message || 
                        "Main street address or postal address line"
                      }
                      inputProps={{ maxLength: 35, style: { textTransform: 'uppercase' } }}
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
                      label="Postal Code *"
                      error={!!personForm.formState.errors.addresses?.[index]?.postal_code}
                      helperText={
                        personForm.formState.errors.addresses?.[index]?.postal_code?.message || 
                        "4-digit postal code"
                      }
                      inputProps={{ 
                        maxLength: 4,
                        pattern: '[0-9]*',
                        inputMode: 'numeric'
                      }}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Additional Address Lines */}
              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_2`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="Address Line 2"
                      helperText="Additional address information (optional)"
                      inputProps={{ maxLength: 35, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_3`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="Address Line 3"
                      helperText="Additional address information (optional)"
                      inputProps={{ maxLength: 35, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              {/* Location Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mt: 1 }}>
                  Location Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_4`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="Suburb / Area"
                      helperText="Suburb or area name"
                      inputProps={{ maxLength: 35, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.address_line_5`}
                  control={personForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      fullWidth
                      label="City / Town"
                      helperText="City or town name"
                      inputProps={{ maxLength: 35, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                />
              </Grid>

              {/* Geographic Details */}
              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.province_code`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <Autocomplete
                        {...field}
                        options={Array.isArray(provinces) ? provinces : []}
                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                        value={Array.isArray(provinces) ? provinces.find(province => province.code === field.value) || null : null}
                        onChange={(_, newValue) => field.onChange(newValue?.code || '')}
                        loading={lookupDataLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Province"
                            helperText="Select province (South Africa only)"
                          />
                        )}
                      />
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name={`addresses.${index}.country_code`}
                  control={personForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Country *</InputLabel>
                      <Select {...field} label="Country *">
                        <MenuItem value="ZA">South Africa</MenuItem>
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="GB">United Kingdom</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Remove Button */}
              {index > 0 && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeAddress(index)}
                    sx={{ mt: 2 }}
                  >
                    Remove This Address
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

  const renderReviewStep = () => {
    const formData = personForm.getValues();
    const isNaturalPerson = ['01', '02'].includes(formData.person_nature);
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Review & Submit
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            {isNewPerson ? 'Please review all information before creating the new person record' : `Ready to update person: ${personFound?.business_or_surname}`}
          </Alert>

          <Grid container spacing={3}>
            {/* Identity Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                Identity Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Person Type</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {PERSON_NATURES.find(n => n.value === formData.person_nature)?.label || 'Not specified'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {isNaturalPerson ? 'Surname' : 'Business Name'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.business_or_surname || 'Not specified'}
              </Typography>
            </Grid>

            {isNaturalPerson && formData.initials && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Initials</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.initials}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Nationality</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.nationality_code === 'ZA' ? 'South African' : 
                 formData.nationality_code === 'US' ? 'United States' :
                 formData.nationality_code === 'GB' ? 'United Kingdom' : 
                 formData.nationality_code || 'Not specified'}
              </Typography>
            </Grid>

            {/* Natural Person Details */}
            {isNaturalPerson && formData.natural_person && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, mt: 3 }}>
                    Personal Details
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">First Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.natural_person.full_name_1 || 'Not specified'}
                  </Typography>
                </Grid>

                {formData.natural_person.full_name_2 && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Middle Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formData.natural_person.full_name_2}
                    </Typography>
                  </Grid>
                )}

                {formData.natural_person.birth_date && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(formData.natural_person.birth_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </>
            )}

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, mt: 3 }}>
                Contact Information
              </Typography>
            </Grid>

            {formData.email_address && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.email_address}
                </Typography>
              </Grid>
            )}

            {formData.home_phone && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Home Phone</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.home_phone}
                </Typography>
              </Grid>
            )}

            {formData.work_phone && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Work Phone</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.work_phone}
                </Typography>
              </Grid>
            )}

            {formData.fax_phone && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fax Phone</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.fax_phone}
                </Typography>
              </Grid>
            )}

            {(formData.cell_phone_country_code || formData.cell_phone) && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Cell Phone</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.cell_phone_country_code && formData.cell_phone 
                    ? `${formData.cell_phone_country_code} ${formData.cell_phone}`
                    : formData.cell_phone || formData.cell_phone_country_code || 'Not specified'}
                </Typography>
              </Grid>
            )}

            {/* ID Documents */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, mt: 3 }}>
                ID Documents ({formData.aliases?.length || 0})
              </Typography>
            </Grid>

            {formData.aliases?.map((alias, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">Document Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {ID_DOCUMENT_TYPES.find(type => type.value === alias.id_document_type_code)?.label || alias.id_document_type_code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">Document Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {alias.id_document_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {alias.country_of_issue === 'ZA' ? 'South Africa' : alias.country_of_issue}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {alias.is_current ? 'Current' : 'Historical'}
                      </Typography>
                    </Grid>
                    {alias.id_document_expiry_date && (
                      <Grid item xs={12} md={1}>
                        <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {new Date(alias.id_document_expiry_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
            ))}

            {/* Addresses */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, mt: 3 }}>
                Addresses ({formData.addresses?.length || 0})
              </Typography>
            </Grid>

            {formData.addresses?.map((address, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {address.address_type === 'street' ? 'Street/Physical Address' : 'Postal Address'}
                        {address.is_primary && (
                          <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Full Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {[
                          address.address_line_1,
                          address.address_line_2,
                          address.address_line_3,
                          address.address_line_4,
                          address.address_line_5
                        ].filter(Boolean).join(', ')}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">Postal Code</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {address.postal_code || 'Not specified'}
                      </Typography>
                    </Grid>

                    {address.province_code && (
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">Province</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {Array.isArray(provinces) ? 
                            provinces.find(p => p.code === address.province_code)?.name || address.province_code :
                            address.province_code
                          }
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {address.country_code === 'ZA' ? 'South Africa' : 
                         address.country_code === 'US' ? 'United States' :
                         address.country_code === 'GB' ? 'United Kingdom' : 
                         address.country_code}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}

            {/* Summary */}
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Ready to {isNewPerson ? 'Create' : 'Update'} Person Record
                </Typography>
                <Typography variant="body2">
                  • Person Type: {PERSON_NATURES.find(n => n.value === formData.person_nature)?.label}
                  <br />
                  • ID Documents: {formData.aliases?.length || 0} document(s)
                  <br />
                  • Addresses: {formData.addresses?.length || 0} address(es)
                  <br />
                  • Contact Methods: {[formData.email_address, formData.home_phone, formData.work_phone, formData.cell_phone, formData.fax_phone].filter(Boolean).length} method(s)
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

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