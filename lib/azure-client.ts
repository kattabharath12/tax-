import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
import { AzureKeyCredential } from '@azure/core-auth';

// Define types based on Azure SDK and working Python code
export interface ExtractedField {
  fieldName: string;
  fieldValue: any;
  confidence: number;
  type?: string;
}

export interface ProcessedDocument {
  docType: string;
  confidence: number;
  fields: ExtractedField[];
}

export interface AzureDocumentAnalysisResult {
  status: string;
  documents: ProcessedDocument[];
  modelUsed: string;
}

export class AzureDocumentClient {
  private client: ReturnType<typeof DocumentIntelligence> | null = null;
  private endpoint: string = "";
  private apiKey: string = "";
  private initialized: boolean = false;

  constructor() {
    // Don't initialize during construction - wait until runtime when actually needed
    // This prevents build-time errors when environment variables aren't available
  }

  private ensureInitialized(): void {
    // Lazy initialization - only create client when first method is called at runtime
    if (this.initialized) {
      return;
    }

    this.endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT || "";
    this.apiKey = process.env.AZURE_DOC_INTELLIGENCE_API_KEY || "";
    
    if (!this.apiKey || !this.endpoint) {
      throw new Error("Azure Document Intelligence API key and endpoint must be configured");
    }

    // Create the Azure Document Intelligence REST client exactly like the working Python code
    this.client = DocumentIntelligence(this.endpoint, new AzureKeyCredential(this.apiKey));
    
    console.log('Azure Document Intelligence Client initialized with:');
    console.log(`Endpoint: ${this.endpoint}`);
    console.log(`API Key (first 10 chars): ${this.apiKey.substring(0, 10)}...`);
    
    this.initialized = true;
  }

  private getModelFromFilename(filename: string): string {
    /**
     * Determine the best model based on filename - EXACTLY like Python code
     */
    const filenameLower = filename.toLowerCase();

    // Define filename patterns and their corresponding models - EXACT match to Python
    const modelMappings = [
      { pattern: /1099.*div/, model: "prebuilt-tax.us.1099DIV" },
      { pattern: /1099.*misc/, model: "prebuilt-tax.us.1099MISC" },
      { pattern: /1099.*int/, model: "prebuilt-tax.us.1099INT" },
      { pattern: /1099.*nec/, model: "prebuilt-tax.us.1099NEC" },
      { pattern: /w.*2/, model: "prebuilt-tax.us.w2" },
      { pattern: /1099/, model: "prebuilt-tax.us.1099" },  // Generic 1099 fallback
      { pattern: /1040/, model: "prebuilt-tax.us.1040" }
    ];

    // Check each pattern
    for (const { pattern, model } of modelMappings) {
      if (pattern.test(filenameLower)) {
        console.log(`✅ Filename pattern matched: ${pattern} -> ${model}`);
        return model;
      }
    }

    // If no specific pattern matches, return the unified tax model
    console.log(`No specific pattern matched for "${filename}", using unified tax model`);
    return "prebuilt-tax.us";
  }

  private getModelCandidates(filename: string): string[] {
    /**
     * Get fallback models (order = try filename-based first, then general fallbacks)
     * EXACTLY matching the Python code logic
     */
    const primaryModel = this.getModelFromFilename(filename);
    
    const modelCandidates = [
      primaryModel,              // Filename-based selection (first priority)
      "prebuilt-tax.us",          // unified tax model
      "prebuilt-tax.us.1099DIV",
      "prebuilt-tax.us.1099MISC",
      "prebuilt-tax.us.1099INT",
      "prebuilt-tax.us.1099NEC",
      "prebuilt-tax.us.w2",       // W-2 specific
      "prebuilt-tax.us.1099",     // 1099 family (may have variations)
      "prebuilt-tax.us.1040",     // 1040 family
    ];

    // Remove duplicates while preserving order
    const seen = new Set();
    return modelCandidates.filter(x => {
      if (seen.has(x)) {
        return false;
      }
      seen.add(x);
      return true;
    });
  }

  private extractFieldValue(field: any): any {
    /**
     * Extract serializable value from DocumentField object - ENHANCED for complex nested structures
     * Based on user's actual DIV/INT examples showing deep nesting
     */
    if (field === null || field === undefined) {
      return null;
    }

    // Handle different field types - matching Python logic exactly
    let value = field.hasOwnProperty('value') ? field.value : field;
    const confidence = field.confidence || null;

    // Handle nested objects and arrays - exactly like Python code
    if (field.valueObject && field.valueObject !== null) {
      // Object type - recursively extract fields
      const objDict: any = {};
      for (const [key, nestedField] of Object.entries(field.valueObject)) {
        objDict[key] = this.extractFieldValue(nestedField);
      }
      return { type: "object", value: objDict, confidence };
    }
    else if (field.valueArray && field.valueArray !== null) {
      // Array type - extract each item
      const arrayList: any[] = [];
      for (const item of field.valueArray) {
        arrayList.push(this.extractFieldValue(item));
      }
      return { type: "array", value: arrayList, confidence };
    }
    else if (field.valueAddress && field.valueAddress !== null) {
      // Address type - extract address components
      const addressDict: any = {};
      const addressObj = field.valueAddress;
      
      // Extract all address properties that aren't private
      for (const key of Object.keys(addressObj)) {
        if (!key.startsWith('_') && typeof addressObj[key] !== 'function') {
          const attrValue = addressObj[key];
          if (attrValue !== null && attrValue !== undefined) {
            addressDict[key] = attrValue;
          }
        }
      }
      return { type: "address", value: addressDict, confidence };
    }
    else {
      // Simple value (string, number, etc.) - but also handle direct value extraction for complex structures
      return { value, confidence };
    }
  }

  /**
   * Enhanced field value extraction for complex nested DIV/INT structures
   * Based on user examples: { "type": "array", "value": [ { "type": "object", "value": { "Box1a": { "value": { "valueNumber": 123 } } } } ] }
   */
  private extractComplexFieldValue(fieldData: any): { extractedValues: any[], confidence: number } {
    const extractedValues: any[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    const recursiveExtract = (data: any, path: string = '') => {
      if (!data) return;

      // Handle array structures (like Transactions)
      if (data.type === 'array' && data.value && Array.isArray(data.value)) {
        data.value.forEach((item: any, index: number) => {
          recursiveExtract(item, `${path}[${index}]`);
        });
        return;
      }

      // Handle object structures
      if (data.type === 'object' && data.value && typeof data.value === 'object') {
        Object.entries(data.value).forEach(([key, value]) => {
          recursiveExtract(value, path ? `${path}.${key}` : key);
        });
        return;
      }

      // Extract numeric values from nested structures
      if (data.value && typeof data.value === 'object') {
        if (typeof data.value.valueNumber === 'number') {
          extractedValues.push({
            path,
            value: data.value.valueNumber,
            confidence: data.confidence || 0,
            type: 'number'
          });
          totalConfidence += (data.confidence || 0);
          confidenceCount++;
        } else if (typeof data.value.valueString === 'string') {
          extractedValues.push({
            path,
            value: data.value.valueString,
            confidence: data.confidence || 0,
            type: 'string'
          });
          totalConfidence += (data.confidence || 0);
          confidenceCount++;
        }
      }

      // Handle direct numeric/string values
      if (typeof data.valueNumber === 'number') {
        extractedValues.push({
          path,
          value: data.valueNumber,
          confidence: data.confidence || 0,
          type: 'number'
        });
        totalConfidence += (data.confidence || 0);
        confidenceCount++;
      } else if (typeof data.valueString === 'string') {
        extractedValues.push({
          path,
          value: data.valueString,
          confidence: data.confidence || 0,
          type: 'string'
        });
        totalConfidence += (data.confidence || 0);
        confidenceCount++;
      }
    };

    try {
      let parsedData = fieldData;
      if (typeof fieldData === 'string') {
        parsedData = JSON.parse(fieldData);
      }
      recursiveExtract(parsedData);
    } catch (error) {
      console.warn('Failed to parse complex field data:', error);
    }

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    return { extractedValues, confidence: averageConfidence };
  }

  async analyzeDocument(fileBuffer: ArrayBuffer, documentType: string, filename?: string): Promise<AzureDocumentAnalysisResult> {
    // Ensure the Azure client is initialized at runtime (not build time)
    this.ensureInitialized();

    if (!filename) {
      throw new Error("Filename is required for proper model selection");
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`PROCESSING: ${filename}`);
    console.log(`${'='.repeat(60)}`);

    const modelCandidates = this.getModelCandidates(filename);
    const primaryModel = modelCandidates[0];
    
    console.log(`Selected primary model based on filename: ${primaryModel}`);
    console.log(`Fallback models available: ${modelCandidates.slice(1).join(', ')}`);

    let result: any = null;
    let lastError: string | null = null;
    let usedModel = '';

    const uint8Array = new Uint8Array(fileBuffer);

    for (const modelId of modelCandidates) {
      console.log(`\nTrying model: ${modelId} ...`);
      
      try {
        // Try new SDK signature - EXACTLY like Python code
        const response = await this.client!.path("/documentModels/{modelId}:analyze", modelId).post({
          contentType: "application/pdf",
          body: uint8Array,
        });

        if (response.status !== "202") {
          console.log(`Model ${modelId} failed with status: ${response.status}`);
          if (response.status === "404" || response.status === "400") {
            console.log(`ModelNotFound for ${modelId} — not available in your resource/region.`);
            continue;
          }
          throw new Error(`Analysis failed with status: ${response.status}`);
        }

        // Get the operation location for polling
        const operationLocation = response.headers["operation-location"];
        if (!operationLocation) {
          throw new Error("No operation location found in response");
        }

        // Extract operation ID from location
        const operationId = operationLocation.split('/').pop()?.split('?')[0];
        if (!operationId) {
          throw new Error("Could not extract operation ID from location");
        }

        // Poll for results - exactly like Python code
        let pollResult: any;
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts = 5 minutes max

        do {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          attempts++;

          const pollResponse = await this.client!.path("/documentModels/{modelId}/analyzeResults/{resultId}", modelId, operationId).get();

          if (pollResponse.status === "200") {
            pollResult = pollResponse.body;
            if (pollResult.status === "succeeded") {
              break;
            } else if (pollResult.status === "failed") {
              throw new Error(`Analysis failed: ${pollResult.error?.message || 'Unknown error'}`);
            }
          }

        } while (attempts < maxAttempts && pollResult?.status !== "succeeded");

        if (pollResult?.status !== "succeeded") {
          throw new Error(`Analysis did not complete within expected time. Final status: ${pollResult?.status}`);
        }

        result = pollResult;
        usedModel = modelId;
        console.log("✓ Success — used model:", modelId);
        if (modelId === primaryModel) {
          console.log("✓ Used the filename-based model selection!");
        }
        break;

      } catch (error: any) {
        if (error.message.includes('ModelNotFound') || error.message.includes('not available')) {
          console.log(`ModelNotFound for ${modelId} — not available in your resource/region.`);
          continue;
        } else {
          lastError = error.message;
          console.log(`Error with ${modelId}: ${error.message}`);
          continue;
        }
      }
    }

    if (result === null) {
      console.log(`\nNo model succeeded for ${filename}. Last error:`, lastError);
      throw new Error(`No model succeeded for ${filename}. Last error: ${lastError}`);
    }

    // Process results exactly like Python code
    console.log(`\n--- Processing Results for ${filename} ---`);

    const processedDocuments: ProcessedDocument[] = [];
    const seenDocuments: string[] = []; // Track duplicates

    if (result.analyzeResult?.documents) {
      for (let i = 0; i < result.analyzeResult.documents.length; i++) {
        const doc = result.analyzeResult.documents[i];
        console.log(`\n--- Document #${i+1} in ${filename} (documentType: ${doc.docType || 'n/a'}) ---`);

        // Check if this is a duplicate (same SSN + Employer ID + Tax Year) - like Python code
        let isDuplicate = false;
        let currentKey: string | null = null;

        // Create a key to identify unique documents
        let ssn: string | null = null;
        let employerId: string | null = null;
        let taxYear: string | null = null;

        // Extract identifying fields
        if (doc.fields) {
          // W-2 fields
          if (doc.fields.Employee?.valueObject?.SocialSecurityNumber?.value) {
            ssn = doc.fields.Employee.valueObject.SocialSecurityNumber.value;
          }
          if (doc.fields.Employer?.valueObject?.IdNumber?.value) {
            employerId = doc.fields.Employer.valueObject.IdNumber.value;
          }
          if (doc.fields.TaxYear?.value) {
            taxYear = doc.fields.TaxYear.value;
          }

          // 1099 fields - check for recipient SSN/TIN and payer EIN
          if (doc.fields.Recipient?.valueObject?.TaxIdNumber?.value) {
            ssn = doc.fields.Recipient.valueObject.TaxIdNumber.value;
          }
          if (doc.fields.Payer?.valueObject?.IdNumber?.value) {
            employerId = doc.fields.Payer.valueObject.IdNumber.value;
          }
        }

        // Create unique key
        if (ssn && employerId && taxYear) {
          currentKey = `${ssn}_${employerId}_${taxYear}`;

          if (seenDocuments.includes(currentKey)) {
            isDuplicate = true;
            console.log(`🔄 DUPLICATE DETECTED - Skipping this copy (same SSN/TIN + Employer/Payer + Tax Year)`);
          } else {
            seenDocuments.push(currentKey);
          }
        }

        if (isDuplicate) {
          continue;
        }

        const fields: ExtractedField[] = [];

        if (doc.fields) {
          const processedFields = new Set<string>(); // Track processed fields to prevent duplicates
          
          for (const [fieldName, field] of Object.entries(doc.fields)) {
            const extractedField = this.extractFieldValue(field);
            const value = extractedField ? extractedField.value : null;
            const conf = extractedField ? extractedField.confidence : null;

            console.log(`${fieldName}: ${value} (confidence: ${conf})`);
            
            // CRITICAL: Handle complex fields like Transactions INSTEAD OF simple fields, not in addition to
            if (fieldName === 'Transactions' && extractedField) {
              const complexExtraction = this.extractComplexFieldValue(extractedField);
              if (complexExtraction.extractedValues.length > 0) {
                console.log(`🔍 Complex extraction for ${fieldName} found ${complexExtraction.extractedValues.length} values:`);
                complexExtraction.extractedValues.forEach((item, index) => {
                  console.log(`  [${index}] ${item.path}: ${item.value} (${Math.round(item.confidence * 100)}%)`);
                  
                  const enhancedFieldName = `${fieldName}_${item.path}`;
                  if (!processedFields.has(enhancedFieldName)) {
                    // Add each extracted value as a separate field for tax calculations
                    fields.push({
                      fieldName: enhancedFieldName,
                      fieldValue: { value: item.value, confidence: item.confidence, type: item.type },
                      confidence: item.confidence,
                      type: item.type
                    });
                    processedFields.add(enhancedFieldName);
                  }
                });
                
                // Mark the parent Transactions field as processed to avoid adding it again
                processedFields.add(fieldName);
                continue; // Skip adding the parent Transactions field
              }
            }
            
            // Only add the field if it hasn't been processed as part of a complex structure
            if (!processedFields.has(fieldName)) {
              fields.push({
                fieldName,
                fieldValue: extractedField,
                confidence: extractedField?.confidence || 0,
                type: extractedField?.type || 'simple'
              });
              processedFields.add(fieldName);
            }
          }
        }

        processedDocuments.push({
          docType: doc.docType || 'unknown',
          confidence: doc.confidence || 0,
          fields
        });
      }
    }

    const totalFields = processedDocuments.reduce((sum, doc) => sum + doc.fields.length, 0);
    console.log(`\n✓ Successfully processed ${filename} with model ${usedModel}`);
    console.log(`📊 Found ${processedDocuments.length} documents with total ${totalFields} fields`);

    return {
      status: 'succeeded',
      documents: processedDocuments,
      modelUsed: usedModel
    };
  }

  // Legacy method for compatibility with existing API
  extractFieldsFromResult(result: AzureDocumentAnalysisResult): Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: number;
  }> {
    const fields: Array<{
      fieldName: string;
      fieldValue: string | null;
      confidence: number;
    }> = [];

    for (const document of result.documents) {
      for (const field of document.fields) {
        fields.push({
          fieldName: field.fieldName,
          fieldValue: field.fieldValue ? JSON.stringify(field.fieldValue, null, 2) : null,
          confidence: field.confidence,
        });
      }
    }

    return fields;
  }
}

// Lazy initialization pattern - client is only created when first accessed
let azureClientInstance: AzureDocumentClient | null = null;

export function getAzureClient(): AzureDocumentClient {
  if (!azureClientInstance) {
    azureClientInstance = new AzureDocumentClient();
  }
  return azureClientInstance;
}
