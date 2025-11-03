
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Calculator, Eye, EyeOff, RefreshCw } from "lucide-react";

interface EnhancedIncomeStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function EnhancedIncomeStep({ taxData, documents, updateTaxData }: EnhancedIncomeStepProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showMathematicalBreakdown, setShowMathematicalBreakdown] = useState(false);
  const [mathematicalBreakdown, setMathematicalBreakdown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  useEffect(() => {
    // Auto-load mathematical breakdown on component mount
    loadMathematicalBreakdown();
  }, []);

  const loadMathematicalBreakdown = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tax-data-extraction");
      
      if (response.ok) {
        const data = await response.json();
        setMathematicalBreakdown(data.mathematicalBreakdown);
        console.log("📊 Mathematical breakdown loaded:", data.mathematicalBreakdown);
        
        // Update tax data if the API has more recent information
        if (data.extractedTaxData) {
          updateTaxData('income', {
            wages: data.extractedTaxData.income.wages || 0,
            interest: data.extractedTaxData.income.interest || 0,
            dividends: data.extractedTaxData.income.dividends || 0,
            other: (data.extractedTaxData.income.nonEmployeeCompensation || 0) + 
                   (data.extractedTaxData.income.miscellaneousIncome || 0) + 
                   (data.extractedTaxData.income.rentalRoyalties || 0) + 
                   (data.extractedTaxData.income.other || 0),
          });
          
          // CRITICAL: Also update withholdings for tax calculation
          updateTaxData('withholdings', {
            federalTax: data.extractedTaxData.withholdings.federalTax || 0,
            stateTax: data.extractedTaxData.withholdings.stateTax || 0,
            socialSecurityTax: data.extractedTaxData.withholdings.socialSecurityTax || 0,
            medicareTax: data.extractedTaxData.withholdings.medicareTax || 0,
          });
        }
      } else {
        console.error("Failed to load mathematical breakdown");
      }
    } catch (error) {
      console.error("Error loading mathematical breakdown:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncomeChange = (field: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    const roundedValue = Math.round(numValue * 100) / 100;
    
    updateTaxData('income', {
      [field]: roundedValue,
    });
  };

  const handleWithholdingChange = (field: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    const roundedValue = Math.round(numValue * 100) / 100;
    
    updateTaxData('withholdings', {
      [field]: roundedValue,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const relevantDocs = (documents || []).filter(doc => {
    const confidence = doc?.confidence || 0;
    return confidence > 0.1 && doc.extractedData && doc.extractedData.length > 0;
  });

  const totalIncome = (taxData?.income?.wages || 0) + 
                     (taxData?.income?.interest || 0) + 
                     (taxData?.income?.dividends || 0) + 
                     (taxData?.income?.other || 0);

  const IncomeSourceCard = ({ title, field, value, mathematicalData }: any) => {
    const [showDetails, setShowDetails] = useState(false);
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor={field} className="text-sm font-medium text-gray-900">{title}</Label>
          <div className="flex items-center space-x-2">
            {value > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Auto-filled</span>
            )}
            {mathematicalData && mathematicalData.sources && mathematicalData.sources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-gray-700 p-1"
              >
                {showDetails ? "Hide" : "Show"} Sources
              </Button>
            )}
          </div>
        </div>
        
        <Input
          id={field}
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => handleIncomeChange(field, e.target.value)}
          placeholder="0.00"
          className="text-lg font-mono border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        
        {/* Document Sources Breakdown */}
        {showDetails && mathematicalData && mathematicalData.sources && mathematicalData.sources.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Sources ({mathematicalData.sources.length} document{mathematicalData.sources.length > 1 ? 's' : ''}):
            </div>
            {mathematicalData.sources.map((source: any, idx: number) => (
              <div key={idx} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-800">{source.document}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {source.documentType.replace('FORM_', '').replace('_', '-')}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      ${source.contribution.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {source.extractedFields && source.extractedFields.length > 0 && (
                  <div className="ml-2 space-y-1">
                    {source.extractedFields.map((field: any, fieldIdx: number) => (
                      <div key={fieldIdx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">
                          {field.box}: {field.boxDetails || field.description}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">${field.amount?.toLocaleString() || '0'}</span>
                          <span className="text-gray-500">({Math.round((field.confidence || 0) * 100)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const WithholdingSourceCard = ({ title, field, value, sourceDescription, mathematicalData }: any) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Create sources data structure for withholdings if we have document data
    const withholdingSources = mathematicalData?.sources || [];
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor={field} className="text-sm font-medium text-gray-900">{title}</Label>
          <div className="flex items-center space-x-2">
            {(value || 0) > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Auto-filled</span>
            )}
            {withholdingSources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-gray-700 p-1"
              >
                {showDetails ? "Hide" : "Show"} Sources
              </Button>
            )}
          </div>
        </div>
        
        <Input
          id={field}
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => handleWithholdingChange(field, e.target.value)}
          placeholder="0.00"
          className="text-lg font-mono border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        
        {/* Show source description when no detailed data available */}
        {!showDetails && (value || 0) > 0 && !withholdingSources.length && (
          <div className="mt-2 text-xs text-gray-500">
            Source: {sourceDescription}
          </div>
        )}
        
        {/* Document Sources Breakdown */}
        {showDetails && withholdingSources.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Sources ({withholdingSources.length} document{withholdingSources.length > 1 ? 's' : ''}):
            </div>
            {withholdingSources.map((source: any, idx: number) => (
              <div key={idx} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-800">
                    {source.document || `Document ${idx + 1}`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {source.documentType || 'Document'} • {source.confidence || 0}% confidence
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      ${source.totalContribution?.toLocaleString() || source.contribution?.toLocaleString() || source.amount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
                
                {source.extractedFields && source.extractedFields.length > 0 && (
                  <div className="ml-2 space-y-1">
                    {source.extractedFields.map((field: any, fieldIdx: number) => (
                      <div key={fieldIdx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">
                          {field.box}: {field.boxDetails || field.description || 'Tax withholding field'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">${field.amount?.toLocaleString() || '0'}</span>
                          <span className="text-gray-500">({field.confidence || 0}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Income</h2>
        <p className="text-sm text-gray-600">
          Review and update your income information
        </p>
      </div>

      {/* Document Status - Clean and Minimal */}
      {relevantDocs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{relevantDocs.length} documents processed</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMathematicalBreakdown}
              disabled={isLoading}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {isLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Income Sources */}
      <div className="grid gap-4">
        <IncomeSourceCard
          title="Wages & Salary"
          field="wages"
          value={taxData.income.wages}
          mathematicalData={mathematicalBreakdown?.incomeBreakdown?.w2Wages}
        />

        <IncomeSourceCard
          title="Interest Income"
          field="interest"
          value={taxData.income.interest}
          mathematicalData={mathematicalBreakdown?.incomeBreakdown?.interest}
        />

        <IncomeSourceCard
          title="Dividend Income"
          field="dividends"
          value={taxData.income.dividends}
          mathematicalData={mathematicalBreakdown?.incomeBreakdown?.dividends}
        />

        <IncomeSourceCard
          title="Other Income"
          field="other"
          value={taxData.income.other}
          mathematicalData={{
            sources: [
              ...(mathematicalBreakdown?.incomeBreakdown?.nonEmployeeCompensation?.sources || []),
              ...(mathematicalBreakdown?.incomeBreakdown?.miscellaneousIncome?.sources || []),
              ...(mathematicalBreakdown?.incomeBreakdown?.rentalRoyalties?.sources || []),
              ...(mathematicalBreakdown?.incomeBreakdown?.otherIncome?.sources || [])
            ]
          }}
        />
      </div>

      {/* Tax Withholdings */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tax Withholdings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Tax amounts withheld from your income
        </p>
        
        <div className="grid gap-4">
          <WithholdingSourceCard
            title="Federal Income Tax"
            field="federalTax"
            value={taxData.withholdings?.federalTax}
            sourceDescription="W-2 Box 2, 1099-INT Box 4, 1099-DIV Box 4, 1099-NEC Box 4, 1099-MISC Box 4"
            mathematicalData={{
              sources: mathematicalBreakdown?.withholdingsBreakdown?.federalTax?.documentBreakdown || []
            }}
          />

          <WithholdingSourceCard
            title="Social Security Tax"
            field="socialSecurityTax"
            value={taxData.withholdings?.socialSecurityTax}
            sourceDescription="W-2 Box 4"
            mathematicalData={{
              sources: mathematicalBreakdown?.withholdingsBreakdown?.socialSecurityTax?.documentBreakdown || []
            }}
          />

          <WithholdingSourceCard
            title="Medicare Tax"
            field="medicareTax"
            value={taxData.withholdings?.medicareTax}
            sourceDescription="W-2 Box 6"
            mathematicalData={{
              sources: mathematicalBreakdown?.withholdingsBreakdown?.medicareTax?.documentBreakdown || []
            }}
          />

          <WithholdingSourceCard
            title="State Income Tax"
            field="stateTax"
            value={taxData.withholdings?.stateTax}
            sourceDescription="State-specific fields from W-2 forms"
            mathematicalData={{
              sources: mathematicalBreakdown?.withholdingsBreakdown?.stateTax?.documentBreakdown || []
            }}
          />
        </div>
      </div>

      {/* Income Summary with Calculation Breakdown */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-gray-900">Total Income</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showCalculationDetails ? "Hide" : "Show"} Calculation
          </Button>
        </div>
        
        {showCalculationDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <div className="text-xs font-medium text-gray-700 mb-2">Income Calculation:</div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Wages & Salary:</span>
                <span>+ {formatCurrency(taxData.income.wages || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Income:</span>
                <span>+ {formatCurrency(taxData.income.interest || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dividend Income:</span>
                <span>+ {formatCurrency(taxData.income.dividends || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Other Income:</span>
                <span>+ {formatCurrency(taxData.income.other || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total:</span>
                <span>= {formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total Income</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</span>
        </div>
      </div>
      
      {/* Total Withholdings Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-gray-900">Total Tax Withholdings</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(
              (taxData.withholdings?.federalTax || 0) + 
              (taxData.withholdings?.socialSecurityTax || 0) + 
              (taxData.withholdings?.medicareTax || 0) + 
              (taxData.withholdings?.stateTax || 0)
            )}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tax credits to apply against your tax liability
        </p>
      </div>


    </div>
  );
}
