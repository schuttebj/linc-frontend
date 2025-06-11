/**
 * Phone Display Component
 * Formats and displays phone numbers consistently across the application
 */

import React from 'react';
import { Typography } from '@mui/material';
import lookupService from '../config/lookupService';

interface PhoneDisplayProps {
  label: string;
  countryCode?: string;
  phoneNumber?: string;
  simplePhone?: string; // For non-cell phones that don't have country codes
}

const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ 
  label, 
  countryCode, 
  phoneNumber, 
  simplePhone 
}) => {
  // If it's a simple phone (home, work, fax), just display as-is
  if (simplePhone) {
    return (
      <Typography>
        <strong>{label}:</strong> {simplePhone}
      </Typography>
    );
  }

  // If it's a cell phone with country code, format it properly
  if (countryCode && phoneNumber) {
    const formattedNumber = lookupService.formatPhoneNumber(countryCode, phoneNumber);
    return (
      <Typography>
        <strong>{label}:</strong> {formattedNumber}
      </Typography>
    );
  }

  // Don't render anything if no phone number is provided
  return null;
};

export default PhoneDisplay; 