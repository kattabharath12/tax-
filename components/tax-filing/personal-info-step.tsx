
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Shield, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PersonalInfoStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PersonalInfoStep({ taxData, documents, updateTaxData }: PersonalInfoStepProps) {
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [autoPopulateStatus, setAutoPopulateStatus] = useState<'none' | 'success' | 'partial' | 'error'>('none');
  
  // ██████ SENIOR AZURE DOCUMENT INTELLIGENCE: MULTI-DOCUMENT PERSONAL INFO EXTRACTION ██████
  const w2Documents = documents.filter(doc => doc.documentType === 'W2' && doc.confidence > 0.1);
  const form1099Documents = documents.filter(doc => 
    (doc.documentType?.includes('1099') || doc.documentType?.includes('FORM_1099')) && 
    doc.confidence > 0.1
  );
  
  const hasW2Data = w2Documents.length > 0;
  const has1099Data = form1099Documents.length > 0;
  const hasAnyTaxData = hasW2Data || has1099Data;

  useEffect(() => {
    // ██████ SENIOR TAX ACCOUNTANT: AUTO-POPULATE FROM BEST AVAILABLE SOURCE ██████
    if (hasAnyTaxData && !taxData.personalInfo.firstName && autoPopulateStatus === 'none') {
      if (hasW2Data) {
        autoPopulateFromDocuments('W2');
      } else if (has1099Data) {
        autoPopulateFromDocuments('1099');
      }
    }
  }, [hasAnyTaxData, taxData.personalInfo.firstName]);

  // Helper function to extract value from Azure Document Intelligence nested structure
  const extractValueFromAzureField = (fieldValue: any): { value: any, confidence: number } => {
    if (!fieldValue) return { value: null, confidence: 0 };
    
    try {
      let parsed = fieldValue;
      if (typeof fieldValue === 'string') {
        parsed = JSON.parse(fieldValue);
      }
      
      // Handle nested Azure Document Intelligence structure
      if (parsed && typeof parsed === 'object') {
        let extractedValue = null;
        let confidence = parsed.confidence || 0;
        
        // Check for value.valueNumber (most common for numbers)
        if (parsed.value && typeof parsed.value.valueNumber === 'number') {
          extractedValue = parsed.value.valueNumber;
        }
        // Check for value.valueString (strings)
        else if (parsed.value && typeof parsed.value.valueString === 'string') {
          extractedValue = parsed.value.valueString;
        }
        // Check for direct valueNumber
        else if (typeof parsed.valueNumber === 'number') {
          extractedValue = parsed.valueNumber;
        }
        // Check for direct valueString
        else if (typeof parsed.valueString === 'string') {
          extractedValue = parsed.valueString;
        }
        // Check for direct value
        else if (parsed.value !== undefined) {
          extractedValue = parsed.value;
        }
        // Fallback to the parsed object itself
        else {
          extractedValue = parsed;
        }
        
        return { value: extractedValue, confidence };
      }
      
      // Direct value
      return { value: parsed, confidence: 1.0 };
      
    } catch (e) {
      // If not JSON, return as-is
      return { value: fieldValue, confidence: 1.0 };
    }
  };

  // ██████ SENIOR AZURE DOCUMENT INTELLIGENCE: UNIFIED PERSONAL INFO EXTRACTION ██████
  const autoPopulateFromDocuments = async (sourceType: 'W2' | '1099') => {
    const sourceDocuments = sourceType === 'W2' ? w2Documents : form1099Documents;
    
    if (sourceDocuments.length === 0) return;

    setIsAutoPopulating(true);
    setAutoPopulateStatus('none');

    try {
      console.log(`🔍 Senior Azure Document Intelligence Developer: Auto-populating personal info from ${sourceType} documents...`);
      
      // Get the document with highest confidence
      const bestDocument = sourceDocuments.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );

      console.log(`📋 Using ${sourceType} document: ${bestDocument.originalFileName || bestDocument.fileName} (${Math.round((bestDocument.confidence || 0) * 100)}% confidence)`);

      // Extract data from the best document
      const extractedData = bestDocument.extractedData || [];
      
      let personalInfo = { ...taxData.personalInfo };
      let fieldsUpdated = 0;

      // ██████ SENIOR TAX ACCOUNTANT: COMPREHENSIVE FIELD EXTRACTION ██████
      extractedData.forEach((field: any) => {
        const fieldName = field.fieldName?.toLowerCase() || '';
        const rawFieldValue = field.fieldValue;
        
        console.log(`🔍 Processing ${sourceType} field: ${field.fieldName} = ${rawFieldValue?.substring(0, 100)}...`);
        
        if (!rawFieldValue) return;

        // ████ PRIORITY 1: Azure Structured Data Extraction ████
        try {
          let structuredData = null;
          
          // Parse structured JSON data
          if (typeof rawFieldValue === 'string' && rawFieldValue.startsWith('{')) {
            structuredData = JSON.parse(rawFieldValue);
          } else {
            structuredData = rawFieldValue;
          }

          // W-2 Employee Structure
          if (sourceType === 'W2' && (fieldName === 'employee' || fieldName.includes('employee'))) {
            const employeeData = structuredData;
            console.log(`📋 W-2 Employee data structure detected`);
            
            // Extract name from nested W-2 structure
            if (employeeData?.value?.Name?.value?.valueString && !personalInfo.firstName) {
              const fullName = employeeData.value.Name.value.valueString;
              const nameParts = fullName.split(/\s+/);
              if (nameParts.length >= 2) {
                personalInfo.firstName = nameParts[0];
                personalInfo.lastName = nameParts.slice(1).join(' ');
                fieldsUpdated += 2;
                console.log(`✅ W-2 Name: ${personalInfo.firstName} ${personalInfo.lastName}`);
              }
            }
            
            // Extract SSN from nested W-2 structure
            if (employeeData?.value?.SocialSecurityNumber?.value?.valueString && !personalInfo.ssn) {
              personalInfo.ssn = employeeData.value.SocialSecurityNumber.value.valueString;
              fieldsUpdated++;
              console.log(`✅ W-2 SSN: ${personalInfo.ssn}`);
            }
            
            // Extract address from nested W-2 structure
            if (employeeData?.value?.Address?.value && !personalInfo.address) {
              extractAddressFromStructure(employeeData.value.Address.value, personalInfo, 'W-2');
              fieldsUpdated += 4;
            }
          }

          // 1099 Recipient Structure (Payer/Recipient can contain taxpayer info)
          else if (sourceType === '1099' && (fieldName.includes('recipient') || fieldName.includes('payer'))) {
            const recipientData = structuredData;
            console.log(`📋 1099 Recipient/Payer data structure detected`);
            
            // Extract name from 1099 recipient structure
            if ((recipientData?.value?.Name?.value?.valueString || recipientData?.value?.name?.value?.valueString) && !personalInfo.firstName) {
              const fullName = recipientData.value.Name?.value?.valueString || recipientData.value.name?.value?.valueString;
              const nameParts = fullName.split(/\s+/);
              if (nameParts.length >= 2) {
                personalInfo.firstName = nameParts[0];
                personalInfo.lastName = nameParts.slice(1).join(' ');
                fieldsUpdated += 2;
                console.log(`✅ 1099 Name: ${personalInfo.firstName} ${personalInfo.lastName}`);
              }
            }
            
            // Extract SSN/TIN from 1099 structure  
            if ((recipientData?.value?.TaxpayerIdentificationNumber?.value?.valueString || recipientData?.value?.tin?.value?.valueString) && !personalInfo.ssn) {
              const tin = recipientData.value.TaxpayerIdentificationNumber?.value?.valueString || recipientData.value.tin?.value?.valueString;
              if (tin && tin.replace(/\D/g, '').length === 9) {
                const ssnDigits = tin.replace(/\D/g, '');
                personalInfo.ssn = `${ssnDigits.slice(0,3)}-${ssnDigits.slice(3,5)}-${ssnDigits.slice(5)}`;
                fieldsUpdated++;
                console.log(`✅ 1099 SSN/TIN: ${personalInfo.ssn}`);
              }
            }
            
            // Extract address from 1099 structure
            if ((recipientData?.value?.Address?.value || recipientData?.value?.address?.value) && !personalInfo.address) {
              const addressData = recipientData.value.Address?.value || recipientData.value.address?.value;
              extractAddressFromStructure(addressData, personalInfo, '1099');
              fieldsUpdated += 4;
            }
          }

        } catch (parseError) {
          console.warn(`⚠️ Failed to parse structured ${sourceType} data:`, parseError);
        }

        // ████ PRIORITY 2: Direct Field Mapping (Fallback) ████
        const extracted = extractValueFromAzureField(rawFieldValue);
        if (extracted.value && extracted.confidence > 0.3) {
          
          // Name extraction patterns
          if (!personalInfo.firstName && typeof extracted.value === 'string') {
            const namePatterns = [
              'name', 'employee_name', 'employee.name', 'recipient_name', 'recipient.name',
              'taxpayer_name', 'taxpayername', 'payee_name', 'payeename'
            ];
            
            if (namePatterns.some(pattern => fieldName.includes(pattern))) {
              const nameParts = extracted.value.split(/\s+/);
              if (nameParts.length >= 2) {
                personalInfo.firstName = nameParts[0];
                personalInfo.lastName = nameParts.slice(1).join(' ');
                fieldsUpdated += 2;
                console.log(`✅ Direct Name Extraction: ${personalInfo.firstName} ${personalInfo.lastName}`);
              }
            }
          }
          
          // SSN/TIN extraction patterns
          if (!personalInfo.ssn && typeof extracted.value === 'string') {
            const ssnPatterns = [
              'ssn', 'social_security_number', 'socialsecuritynumber', 'employee_ssn', 'employee.ssn',
              'tin', 'taxpayer_identification_number', 'taxpayeridentificationnumber',
              'recipient_tin', 'recipient.tin', 'payee_tin', 'payeetin'
            ];
            
            if (ssnPatterns.some(pattern => fieldName.includes(pattern))) {
              const ssnDigits = extracted.value.replace(/\D/g, '');
              if (ssnDigits.length === 9) {
                personalInfo.ssn = `${ssnDigits.slice(0,3)}-${ssnDigits.slice(3,5)}-${ssnDigits.slice(5)}`;
                fieldsUpdated++;
                console.log(`✅ Direct SSN/TIN Extraction: ${personalInfo.ssn}`);
              }
            }
          }
          
          // Address extraction patterns
          if (!personalInfo.address && typeof extracted.value === 'string') {
            const addressPatterns = [
              'address', 'employee_address', 'employee.address', 'recipient_address', 'recipient.address',
              'taxpayer_address', 'taxpayeraddress', 'payee_address', 'payeeaddress', 'mailing_address'
            ];
            
            if (addressPatterns.some(pattern => fieldName.includes(pattern))) {
              personalInfo.address = extracted.value;
              
              const { street, city, state, zip } = parseAddress(extracted.value);
              if (street) personalInfo.street = street;
              if (city) personalInfo.city = city;
              if (state) personalInfo.state = state;
              if (zip) personalInfo.zip = zip;
              
              fieldsUpdated += (street || city || state || zip) ? 4 : 1;
              console.log(`✅ Direct Address Extraction: ${extracted.value}`);
            }
          }
        }
      });

      // Update tax data if we found information
      if (fieldsUpdated > 0) {
        updateTaxData('personalInfo', personalInfo);
        setAutoPopulateStatus('success');
        console.log(`🎉 Successfully auto-populated ${fieldsUpdated} fields from ${sourceType} data`);
      } else {
        setAutoPopulateStatus('partial');
        console.log(`⚠️ No extractable personal information found in ${sourceType} documents`);
      }

    } catch (error) {
      console.error(`❌ Error auto-populating from ${sourceType}:`, error);
      setAutoPopulateStatus('error');
    } finally {
      setIsAutoPopulating(false);
    }
  };

  // Helper function to extract address from structured data
  const extractAddressFromStructure = (addressData: any, personalInfo: any, source: string) => {
    // Use individual address components directly from Azure (most accurate)
    if (addressData.streetAddress) {
      personalInfo.street = addressData.streetAddress;
      console.log(`✅ ${source} Street: ${personalInfo.street}`);
    }
    
    if (addressData.city) {
      personalInfo.city = addressData.city;
      console.log(`✅ ${source} City: ${personalInfo.city}`);
    }
    
    if (addressData.state) {
      personalInfo.state = addressData.state;
      console.log(`✅ ${source} State: ${personalInfo.state}`);
    }
    
    if (addressData.postalCode) {
      personalInfo.zip = addressData.postalCode;
      console.log(`✅ ${source} ZIP: ${personalInfo.zip}`);
    }
    
    // Build full address for display if components exist
    if (personalInfo.street || personalInfo.city || personalInfo.state || personalInfo.zip) {
      const addressParts = [];
      if (personalInfo.street) addressParts.push(personalInfo.street);
      if (personalInfo.city) addressParts.push(personalInfo.city);
      if (personalInfo.state) addressParts.push(personalInfo.state);
      if (personalInfo.zip) addressParts.push(personalInfo.zip);
      personalInfo.address = addressParts.join(', ');
      console.log(`✅ ${source} Full Address: ${personalInfo.address}`);
    }
  };

  const parseAddress = (fullAddress: string) => {
    const address = fullAddress.trim();
    
    // Try to extract ZIP code (5 or 9 digits at the end)
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\s*$/);
    const zip = zipMatch ? zipMatch[1] : '';
    
    // Try to extract state (2 letters before ZIP)
    const beforeZip = zip ? address.substring(0, address.lastIndexOf(zip)).trim() : address;
    const stateMatch = beforeZip.match(/\b([A-Z]{2})\s*,?\s*$/);
    const state = stateMatch ? stateMatch[1] : '';
    
    // Try to extract city (word before state)
    const beforeState = state ? beforeZip.substring(0, beforeZip.lastIndexOf(state)).trim() : beforeZip;
    const cityMatch = beforeState.match(/,?\s*([^,]+?)\s*,?\s*$/);
    const city = cityMatch ? cityMatch[1].trim() : '';
    
    // Remaining is street address
    const street = city ? beforeState.substring(0, beforeState.lastIndexOf(city)).replace(/,?\s*$/, '').trim() : beforeState;
    
    return { street, city, state, zip };
  };

  const handleInputChange = (field: string, value: string | number) => {
    updateTaxData('personalInfo', {
      [field]: value,
    });
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    handleInputChange('ssn', formatted);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600">
          Verify and complete your personal information for your tax return.
        </p>
      </div>

      {/* ██████ SENIOR NEXTJS DEVELOPER: MULTI-SOURCE AUTO-POPULATE STATUS ██████ */}
      {hasAnyTaxData && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {autoPopulateStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {autoPopulateStatus === 'partial' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                {autoPopulateStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {autoPopulateStatus === 'none' && <Shield className="w-5 h-5 text-blue-500" />}
                
                <div>
                  <p className="font-semibold text-gray-900">
                    {autoPopulateStatus === 'success' && 'Information Auto-Populated'}
                    {autoPopulateStatus === 'partial' && 'Partial Information Available'}
                    {autoPopulateStatus === 'error' && 'Auto-Population Failed'}
                    {autoPopulateStatus === 'none' && (
                      hasW2Data ? 'W-2 Data Available' : '1099 Data Available'
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {autoPopulateStatus === 'success' && (
                      hasW2Data 
                        ? `Data extracted from ${w2Documents.length} W-2 document(s)`
                        : `Data extracted from ${form1099Documents.length} 1099 document(s)`
                    )}
                    {autoPopulateStatus === 'partial' && 'Please review and complete the information below'}
                    {autoPopulateStatus === 'error' && 'Please enter your information manually'}
                    {autoPopulateStatus === 'none' && (
                      hasW2Data 
                        ? 'Ready to auto-populate from your W-2'
                        : 'Ready to auto-populate from your 1099s (as fallback when W-2 is not available)'
                    )}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (hasW2Data) {
                    autoPopulateFromDocuments('W2');
                  } else if (has1099Data) {
                    autoPopulateFromDocuments('1099');
                  }
                }}
                disabled={isAutoPopulating}
              >
                {isAutoPopulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {autoPopulateStatus === 'none' ? 'Auto-Fill' : 'Refresh'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-500" />
            Basic Information
            {(taxData.personalInfo.firstName || taxData.personalInfo.lastName || taxData.personalInfo.ssn) && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Data Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={taxData.personalInfo.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={taxData.personalInfo.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ssn" className="text-sm font-semibold text-gray-700">
              Social Security Number *
            </Label>
            <Input
              id="ssn"
              value={taxData.personalInfo.ssn || ''}
              onChange={handleSSNChange}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
              className="mt-1 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: 123-45-6789</p>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-500" />
            Address Information
            {(taxData.personalInfo.street || taxData.personalInfo.city || taxData.personalInfo.state || taxData.personalInfo.zip) && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Data Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street" className="text-sm font-semibold text-gray-700">
              Street Address *
            </Label>
            <Input
              id="street"
              value={taxData.personalInfo.street || ''}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
              Apt/Suite/Unit/Floor (Optional)
            </Label>
            <Input
              id="unit"
              value={taxData.personalInfo.unit || ''}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              placeholder="Apt 4B, Suite 200, Unit 15, Floor 3, etc."
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                City *
              </Label>
              <Input
                id="city"
                value={taxData.personalInfo.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                State *
              </Label>
              <Input
                id="state"
                value={taxData.personalInfo.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className="mt-1 uppercase"
              />
            </div>
            <div>
              <Label htmlFor="zip" className="text-sm font-semibold text-gray-700">
                ZIP Code *
              </Label>
              <Input
                id="zip"
                value={taxData.personalInfo.zip || ''}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="12345"
                maxLength={10}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-500" />
            Filing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="filingStatus" className="text-sm font-semibold text-gray-700">
              Filing Status *
            </Label>
            <Select
              value={taxData.personalInfo.filingStatus || 'single'}
              onValueChange={(value) => handleInputChange('filingStatus', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select filing status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married-jointly">Married Filing Jointly</SelectItem>
                <SelectItem value="married-separately">Married Filing Separately</SelectItem>
                <SelectItem value="head-of-household">Head of Household</SelectItem>
                <SelectItem value="qualifying-widow">Qualifying Widow(er)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dependents" className="text-sm font-semibold text-gray-700">
              Number of Dependents
            </Label>
            <Input
              id="dependents"
              type="number"
              min="0"
              max="20"
              value={taxData.personalInfo.dependents || 0}
              onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the number of qualifying children and other dependents
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Professional Note */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Security:</strong> All personal information is extracted exclusively from your uploaded tax documents (W-2, 1099 forms) using Azure Document Intelligence. 
          No mock data is used. This information is encrypted, processed securely, and used solely for preparing your tax return. Never shared with third parties.
        </AlertDescription>
      </Alert>
    </div>
  );
}
