import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Badge,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { API_ENDPOINTS } from '../../config/api';

// Types based on backend models
interface PersonSearchForm {
  // Basic search fields
  search_text?: string;
  id_document_number?: string;
  business_or_surname?: string;
  first_name?: string;
  person_nature?: string;
  nationality_code?: string;
  email_address?: string;
  cell_phone?: string;
  
  // Advanced filters
  province_code?: string;
  city?: string;
  is_active?: boolean;
  created_date_from?: string;
  created_date_to?: string;
  
  // Pagination
  skip?: number;
  limit?: number;
}

interface PersonSearchResult {
  id: string;
  business_or_surname: string;
  initials?: string;
  person_nature: string;
  nationality_code: string;
  email_address?: string;
  cell_phone?: string;
  is_active: boolean;
  created_at: string;
  
  // Related data
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
    address_line_4?: string; // suburb
    postal_code?: string;
    is_primary: boolean;
  }>;
}

interface SearchResponse {
  persons: PersonSearchResult[];
  total_count: number;
  search_summary: {
    total_results: number;
    search_time_ms: number;
    filters_applied: string[];
  };
}

// Lookup data
const PERSON_NATURES = [
  { value: '01', label: 'Male (Natural Person)', icon: '👨' },
  { value: '02', label: 'Female (Natural Person)', icon: '👩' },
  { value: '03', label: 'Company/Corporation', icon: '🏢' },
  { value: '10', label: 'Close Corporation', icon: '🏪' },
  { value: '11', label: 'Trust', icon: '🏛️' },
  { value: '12', label: 'Partnership', icon: '🤝' },
  { value: '13', label: 'Sole Proprietorship', icon: '👤' },
  { value: '14', label: 'Association', icon: '🏘️' },
  { value: '15', label: 'Cooperative', icon: '🔗' },
  { value: '16', label: 'Non-Profit Organization', icon: '❤️' },
  { value: '17', label: 'Other Organization', icon: '📋' }
];

const ID_DOCUMENT_TYPES = [
  { value: '01', label: 'TRN', fullLabel: 'Tax Reference Number' },
  { value: '02', label: 'RSA ID', fullLabel: 'South African ID Document' },
  { value: '03', label: 'Foreign ID', fullLabel: 'Foreign ID Document' },
  { value: '04', label: 'BRN', fullLabel: 'Business Registration Number' },
  { value: '13', label: 'Passport', fullLabel: 'Passport' }
];

const NATIONALITIES = [
  { value: 'ZA', label: 'South African' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' }
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

const PersonSearchPage = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchResult | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues
  } = useForm<PersonSearchForm>({
    defaultValues: {
      search_text: '',
      skip: 0,
      limit: 25,
      is_active: true
    }
  });

  // Perform search
  const onSearch = async (data: PersonSearchForm) => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare search request
      const searchParams = {
        ...data,
        skip: page * rowsPerPage,
        limit: rowsPerPage
      };

      const response = await fetch(API_ENDPOINTS.personSearch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(searchParams)
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const result: SearchResponse = await response.json();
      setSearchResults(result);
      
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Quick search by ID number
  const onQuickIdSearch = async (idNumber: string) => {
    if (!idNumber || idNumber.length < 3) return;
    
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.personSearchById(idNumber), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json() as PersonSearchResult[];
      setSearchResults({
        persons: results,
        total_count: results.length,
        search_summary: {
          total_results: results.length,
          search_time_ms: 0,
          filters_applied: ['id_number']
        }
      });
    } catch (err) {
      console.error('Quick search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all search fields
  const clearSearch = () => {
    reset();
    setSearchResults(null);
    setPage(0);
  };

  // Handle pagination
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
    const currentData = getValues();
    setValue('skip', newPage * rowsPerPage);
    onSearch(currentData);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setValue('limit', newRowsPerPage);
    setValue('skip', 0);
    const currentData = getValues();
    onSearch(currentData);
  };

  // View person details
  const viewPersonDetails = (person: PersonSearchResult) => {
    setSelectedPerson(person);
    setViewDialogOpen(true);
  };

  // Get person nature display
  const getPersonNatureDisplay = (personNature: string) => {
    const nature = PERSON_NATURES.find(n => n.value === personNature);
    return nature ? `${nature.icon} ${nature.label}` : personNature;
  };

  // Get ID document display
  const getIdDocumentDisplay = (aliases: any[]) => {
    const currentAlias = aliases?.find(a => a.is_current);
    if (!currentAlias) return 'No ID';
    
    const docType = ID_DOCUMENT_TYPES.find(t => t.value === currentAlias.id_document_type_code);
    return `${docType?.label || currentAlias.id_document_type_code}: ${currentAlias.id_document_number}`;
  };

  // Get primary address display
  const getPrimaryAddressDisplay = (addresses: any[]) => {
    const primaryAddress = addresses?.find(a => a.is_primary);
    if (!primaryAddress) return 'No address';
    
    return `${primaryAddress.address_line_1}${primaryAddress.address_line_4 ? `, ${primaryAddress.address_line_4}` : ''}${primaryAddress.postal_code ? ` ${primaryAddress.postal_code}` : ''}`;
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Person Search
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Search for persons in the system using various criteria. Use quick search for ID numbers or advanced search for detailed filtering.
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit(onSearch)}>
          <Grid container spacing={3}>
            {/* Quick Search */}
            <Grid item xs={12} md={6}>
              <Controller
                name="search_text"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quick Search"
                    placeholder="Search by name, email, phone, or ID number..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: field.value && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setValue('search_text', '')} size="small">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            {/* ID Number Quick Search */}
            <Grid item xs={12} md={4}>
              <Controller
                name="id_document_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="ID Document Number"
                    placeholder="13-digit ID or document number"
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-search on ID number input (when 13 digits for RSA ID)
                      if (e.target.value.length === 13 && /^\d+$/.test(e.target.value)) {
                        onQuickIdSearch(e.target.value);
                      }
                    }}
                    helperText="Auto-searches at 13 digits for RSA ID"
                  />
                )}
              />
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={<SearchIcon />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                
                <Button
                  onClick={clearSearch}
                  variant="outlined"
                  fullWidth
                  size="small"
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>
            </Grid>

            {/* Advanced Search Toggle */}
            <Grid item xs={12}>
              <Button
                onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                startIcon={advancedSearchOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                variant="text"
              >
                Advanced Search
              </Button>
            </Grid>

            {/* Advanced Search Fields */}
            <Collapse in={advancedSearchOpen} sx={{ width: '100%' }}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="business_or_surname"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Surname/Business Name"
                        placeholder="Exact surname or business name"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="first_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        placeholder="First/given name"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="person_nature"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Person Nature</InputLabel>
                        <Select {...field} label="Person Nature">
                          <MenuItem value="">All Types</MenuItem>
                          {PERSON_NATURES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
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
                            label="Nationality"
                            placeholder="Select nationality"
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="email_address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="email"
                        label="Email Address"
                        placeholder="email@example.com"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="cell_phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cell Phone"
                        placeholder="Cell phone number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="province_code"
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
                            placeholder="Select province"
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>
        </form>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults && (
        <Paper sx={{ mt: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6">
              Search Results
              <Badge badgeContent={searchResults.total_count} color="primary" sx={{ ml: 2 }} />
            </Typography>
            
            {searchResults.search_summary && (
              <Typography variant="body2" color="text.secondary">
                Found {searchResults.search_summary.total_results} results in {searchResults.search_summary.search_time_ms}ms
                {searchResults.search_summary.filters_applied.length > 0 && (
                  <span> • Filters: {searchResults.search_summary.filters_applied.join(', ')}</span>
                )}
              </Typography>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Person Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Identification</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.persons.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {person.business_or_surname}
                          {person.initials && `, ${person.initials}`}
                        </Typography>
                        {person.natural_person?.full_name_1 && (
                          <Typography variant="body2" color="text.secondary">
                            {person.natural_person.full_name_1} {person.natural_person.full_name_2}
                          </Typography>
                        )}
                        {person.natural_person?.birth_date && (
                          <Typography variant="caption" color="text.secondary">
                            Born: {new Date(person.natural_person.birth_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={getPersonNatureDisplay(person.person_nature)}
                        size="small"
                        color={['01', '02'].includes(person.person_nature) ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {getIdDocumentDisplay(person.aliases || [])}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        {person.email_address && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" />
                            {person.email_address}
                          </Typography>
                        )}
                        {person.cell_phone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            {person.cell_phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {getPrimaryAddressDisplay(person.addresses || [])}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={person.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={person.is_active ? 'success' : 'error'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => viewPersonDetails(person)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Person">
                          <IconButton
                            size="small"
                            onClick={() => window.location.href = `/persons/${person.id}/edit`}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={searchResults.total_count}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Person Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Person Details
          {selectedPerson && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedPerson.business_or_surname}
              {selectedPerson.natural_person?.full_name_1 && 
                ` - ${selectedPerson.natural_person.full_name_1} ${selectedPerson.natural_person.full_name_2 || ''}`
              }
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedPerson && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Person Type</Typography>
                        <Typography>{getPersonNatureDisplay(selectedPerson.person_nature)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Nationality</Typography>
                        <Typography>{NATIONALITIES.find(n => n.value === selectedPerson.nationality_code)?.label}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedPerson.is_active ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={selectedPerson.is_active ? 'success' : 'error'} 
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Created</Typography>
                        <Typography>{new Date(selectedPerson.created_at).toLocaleDateString()}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Identification Documents */}
              {selectedPerson.aliases && selectedPerson.aliases.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Identification Documents
                      </Typography>
                      {selectedPerson.aliases.map((alias, _index) => (
                        <Box key={alias.id} sx={{ mb: 1 }}>
                          <Typography>
                            <strong>{ID_DOCUMENT_TYPES.find(t => t.value === alias.id_document_type_code)?.fullLabel}:</strong> {alias.id_document_number}
                            {alias.is_current && (
                              <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Addresses */}
              {selectedPerson.addresses && selectedPerson.addresses.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Addresses
                      </Typography>
                      {selectedPerson.addresses.map((address, _index) => (
                        <Box key={address.id} sx={{ mb: 1 }}>
                          <Typography>
                            <strong>{address.address_type === 'street' ? 'Street' : 'Postal'} Address:</strong>
                            {address.is_primary && (
                              <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {address.address_line_1}
                            {address.address_line_4 && `, ${address.address_line_4}`}
                            {address.postal_code && ` ${address.postal_code}`}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Contact Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedPerson.email_address && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography>{selectedPerson.email_address}</Typography>
                        </Grid>
                      )}
                      {selectedPerson.cell_phone && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Cell Phone</Typography>
                          <Typography>{selectedPerson.cell_phone}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedPerson && (
            <Button
              variant="contained"
              onClick={() => window.location.href = `/persons/${selectedPerson.id}/edit`}
            >
              Edit Person
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonSearchPage; 