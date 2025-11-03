
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, User, DollarSign, Calculator, FileText, ChevronDown, ChevronUp, TrendingUp, Percent, MapPin } from "lucide-react";
import { calculateComprehensiveTax, ComprehensiveTaxResult } from "@/lib/tax-calculations";
import { stateTaxCalculator2025, type StateTaxResult } from "@/lib/state-tax-calculator-2025";

interface ReviewStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ReviewStep({ taxData, documents }: ReviewStepProps) {
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showBracketBreakdown, setShowBracketBreakdown] = useState(false);
  const [showStateTaxDetails, setShowStateTaxDetails] = useState(false);
  const [comprehensiveTaxResult, setComprehensiveTaxResult] = useState<ComprehensiveTaxResult | null>(null);
  const [stateTaxResult, setStateTaxResult] = useState<StateTaxResult | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Calculate comprehensive tax using industry-standard engine
  useEffect(() => {
    const calculateTax = () => {
      try {
        setCalculationLoading(true);
        
        // Convert taxData to the expected TaxDocumentData format
        const mockTaxData = {
          income: {
            wages: taxData?.income?.wages || 0,
            interest: taxData?.income?.interest || 0,
            dividends: taxData?.income?.dividends || 0,
            nonEmployeeCompensation: 0, // Extract from other income if needed
            miscellaneousIncome: taxData?.income?.other || 0,
            rentalRoyalties: 0,
            other: 0
          },
          withholdings: {
            federalTax: taxData?.withholdings?.federalTax || 0,
            stateTax: taxData?.withholdings?.stateTax || 0,
            socialSecurityTax: taxData?.withholdings?.socialSecurityTax || 0,
            medicareTax: taxData?.withholdings?.medicareTax || 0
          },
          personalInfo: {
            name: `${taxData?.personalInfo?.firstName || ''} ${taxData?.personalInfo?.lastName || ''}`.trim(),
            ssn: taxData?.personalInfo?.ssn || '',
            address: taxData?.personalInfo?.address || ''
          },
          breakdown: {
            byDocument: []
          }
        };

        console.log('🧮 INDUSTRY-STANDARD TAX CALCULATION: Starting comprehensive calculation (Federal + State)...');
        
        // Calculate Federal Tax
        const federalResult = calculateComprehensiveTax(
          mockTaxData,
          taxData?.personalInfo?.filingStatus || 'single',
          false, // useItemizedDeductions
          0,     // itemizedDeductionAmount
          0      // estimatedTaxPayments
        );

        setComprehensiveTaxResult(federalResult);
        
        // Calculate State Tax (if state is provided)
        let stateResult: StateTaxResult | null = null;
        console.log('🔍 REVIEW STATE DEBUG - State:', taxData?.personalInfo?.state);
        
        if (taxData?.personalInfo?.state) {
          try {
            console.log('✅ REVIEW: State provided, calculating state tax for:', taxData.personalInfo.state);
            
            const totalIncome = (taxData.income?.wages || 0) + 
                               (taxData.income?.interest || 0) + 
                               (taxData.income?.dividends || 0) + 
                               (taxData.income?.other || 0);

            const stateData = {
              state: taxData.personalInfo.state,
              filingStatus: taxData?.personalInfo?.filingStatus || 'single',
              income: totalIncome,
              federalAGI: federalResult.phases.phase3_AdjustedGrossIncome.adjustedGrossIncome,
              itemizedDeductions: 0,
              dependents: taxData.personalInfo?.dependents || 0,
              age: taxData.personalInfo?.age || 0,
              isBlind: taxData.personalInfo?.isBlind || false,
              spouseAge: taxData.personalInfo?.spouseAge || 0,
              spouseIsBlind: taxData.personalInfo?.spouseIsBlind || false,
              dividends: taxData.income?.dividends || 0,
              interest: taxData.income?.interest || 0,
              capitalGains: taxData.income?.capitalGains || 0,
              dependentsUnder17: taxData.personalInfo?.dependentsUnder17 || 0,
              dependentsOver17: taxData.personalInfo?.dependentsOver17 || 0
            };

            console.log('🏛️ REVIEW State Tax Input Data:', stateData);
            stateResult = stateTaxCalculator2025.calculateStateTax(stateData);
            console.log('🎯 REVIEW State Tax Result:', stateResult);
            
          } catch (stateError) {
            console.error('❌ REVIEW State tax calculation failed:', stateError);
            console.error('Stack trace:', (stateError as Error)?.stack);
          }
        } else {
          console.log('⚠️ REVIEW: No state provided - skipping state tax calculation');
        }

        setStateTaxResult(stateResult);
        console.log('✅ Tax calculation complete - Federal:', federalResult, 'State:', stateResult);
        
      } catch (error) {
        console.error('❌ Tax calculation failed:', error);
      } finally {
        setCalculationLoading(false);
      }
    };

    if (taxData) {
      calculateTax();
    }
  }, [taxData]);

  // Safe calculations with proper null handling
  const totalIncome = (taxData?.income?.wages || 0) + 
                     (taxData?.income?.interest || 0) + 
                     (taxData?.income?.dividends || 0) + 
                     (taxData?.income?.other || 0);
  
  const isComplete = Boolean(
    taxData?.personalInfo?.firstName && 
    taxData?.personalInfo?.lastName && 
    taxData?.personalInfo?.ssn
  );

  // Calculate data quality metrics
  const processedDocs = (documents || []).filter(doc => (doc?.confidence || 0) > 0.1);
  const highConfidenceDocs = (documents || []).filter(doc => (doc?.confidence || 0) > 0.9);

  if (calculationLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Calculating your taxes using IRS-standard methodology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Review Your Tax Return</h2>
        <p className="text-muted-foreground">
          Please review all information before proceeding to filing. You can go back to any step to make changes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold">Ready to File</div>
                <div className="text-sm text-green-600">All required information completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold">{documents.length} Documents</div>
                <div className="text-sm text-muted-foreground">
                  {documents.filter(d => d.confidence > 0).length} successfully processed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between">
                <span className="text-sm">Name:</span>
                <span className="text-sm font-medium">
                  {taxData.personalInfo.firstName} {taxData.personalInfo.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">SSN:</span>
                <span className="text-sm font-medium">
                  {taxData.personalInfo.ssn || 'Not provided'}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span className="text-sm">Filing Status:</span>
                <span className="text-sm font-medium capitalize">
                  {taxData.personalInfo.filingStatus.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Dependents:</span>
                <span className="text-sm font-medium">{taxData.personalInfo.dependents}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Income Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Wages, Salaries, Tips:</span>
            <span className="font-medium">{formatCurrency(taxData.income.wages)}</span>
          </div>
          <div className="flex justify-between">
            <span>Interest Income:</span>
            <span className="font-medium">{formatCurrency(taxData.income.interest)}</span>
          </div>
          <div className="flex justify-between">
            <span>Dividend Income:</span>
            <span className="font-medium">{formatCurrency(taxData.income.dividends)}</span>
          </div>
          <div className="flex justify-between">
            <span>Other Income:</span>
            <span className="font-medium">{formatCurrency(taxData.income.other)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Income:</span>
            <span>{formatCurrency(totalIncome)}</span>
          </div>
          {comprehensiveTaxResult && (
            <div className="flex justify-between font-semibold text-blue-700">
              <span>Adjusted Gross Income (AGI):</span>
              <span>{formatCurrency(comprehensiveTaxResult.summary.adjustedGrossIncome)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ⭐ INDUSTRY-STANDARD TAX CALCULATION BREAKDOWN */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Tax Calculation Breakdown
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            >
              {showCalculationDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showCalculationDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Summary */}
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(comprehensiveTaxResult?.summary.adjustedGrossIncome || totalIncome)}
              </div>
              <div className="text-sm text-blue-600">Adjusted Gross Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(comprehensiveTaxResult?.summary.taxableIncome || (totalIncome - (taxData?.deductions?.standard || 13850)))}
              </div>
              <div className="text-sm text-blue-600">Taxable Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(comprehensiveTaxResult?.summary.totalTaxLiability || taxData.taxCalculation.federalTax)}
              </div>
              <div className="text-sm text-green-600">Total Tax Liability</div>
            </div>
          </div>

          {showCalculationDetails && comprehensiveTaxResult && (
            <div className="space-y-6">
              {/* Step 1: AGI Calculation */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700">Step 1: Adjusted Gross Income (AGI)</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>Total Income:</span>
                    <span>{formatCurrency(comprehensiveTaxResult.phases.phase3_AdjustedGrossIncome.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Less: Above-the-line deductions:</span>
                    <span>-{formatCurrency(comprehensiveTaxResult.phases.phase3_AdjustedGrossIncome.aboveTheLineDeductions)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Adjusted Gross Income (AGI):</span>
                    <span>{formatCurrency(comprehensiveTaxResult.phases.phase3_AdjustedGrossIncome.adjustedGrossIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Deductions */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-700">Step 2: Deductions</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>Standard Deduction ({taxData?.personalInfo?.filingStatus || 'single'}):</span>
                    <span>{formatCurrency(comprehensiveTaxResult.phases.phase4_DeductionDetermination.standardDeduction)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Using {comprehensiveTaxResult.phases.phase4_DeductionDetermination.useStandardDeduction ? 'Standard' : 'Itemized'} Deduction
                  </div>
                </div>
              </div>

              {/* Step 3: Taxable Income */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-700">Step 3: Taxable Income</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>AGI:</span>
                    <span>{formatCurrency(comprehensiveTaxResult.phases.phase5_TaxableIncome.agi)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Less: Deduction:</span>
                    <span>-{formatCurrency(comprehensiveTaxResult.phases.phase5_TaxableIncome.deduction)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Taxable Income:</span>
                    <span>{formatCurrency(comprehensiveTaxResult.phases.phase5_TaxableIncome.taxableIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Tax Bracket Breakdown */}
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-red-700">Step 4: Federal Income Tax (Progressive Brackets)</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBracketBreakdown(!showBracketBreakdown)}
                  >
                    {showBracketBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Brackets
                  </Button>
                </div>
                
                {showBracketBreakdown && comprehensiveTaxResult.phases.phase6_RegularTax.bracketBreakdown && (
                  <div className="space-y-2">
                    {comprehensiveTaxResult.phases.phase6_RegularTax.bracketBreakdown.map((bracket, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 text-sm p-2 bg-gray-50 rounded">
                        <div className="font-mono text-xs">{bracket.bracketRange}</div>
                        <div className="text-center">{formatPercentage(bracket.rate)}</div>
                        <div className="text-right">{formatCurrency(bracket.taxableInThisBracket)}</div>
                        <div className="text-right font-semibold">{formatCurrency(bracket.taxFromThisBracket)}</div>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-2 text-sm font-bold border-t pt-2">
                      <div>Total:</div>
                      <div></div>
                      <div></div>
                      <div className="text-right">{formatCurrency(comprehensiveTaxResult.phases.phase6_RegularTax.ordinaryIncomeTax)}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-semibold mt-2">
                  <span>Regular Income Tax:</span>
                  <span>{formatCurrency(comprehensiveTaxResult.phases.phase6_RegularTax.ordinaryIncomeTax)}</span>
                </div>
              </div>

              {/* Tax Rates */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="font-semibold">Marginal Tax Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPercentage(comprehensiveTaxResult.summary.marginalTaxRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Rate on next dollar earned</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Percent className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold">Effective Tax Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(comprehensiveTaxResult.summary.effectiveTaxRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average rate on all income</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              Final Tax Summary (Federal & State)
            </div>
            {stateTaxResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStateTaxDetails(!showStateTaxDetails)}
              >
                {showStateTaxDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Federal Tax Liability:</span>
            <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.totalTaxLiability || taxData.taxCalculation.federalTax)}</span>
          </div>
          {stateTaxResult ? (
            <div className="flex justify-between">
              <span>State Tax Liability ({stateTaxResult.state}):</span>
              <span className="font-medium text-orange-600">{formatCurrency(stateTaxResult.stateTax)}</span>
            </div>
          ) : taxData?.personalInfo?.state ? (
            <div className="flex justify-between">
              <span>State Tax Liability ({taxData.personalInfo.state}):</span>
              <span className="font-medium text-yellow-600">Calculating...</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span>State Tax Liability:</span>
              <span className="font-medium text-muted-foreground">No state provided</span>
            </div>
          )}
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold">Total Tax Liability:</span>
            <span className="font-semibold text-red-600">
              {formatCurrency((comprehensiveTaxResult?.summary.totalTaxLiability || 0) + (stateTaxResult?.stateTax || 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Federal Tax Withholdings:</span>
            <span className="font-medium">{formatCurrency(taxData?.withholdings?.federalTax || 0)}</span>
          </div>
          {(taxData?.withholdings?.stateTax || 0) > 0 && (
            <div className="flex justify-between">
              <span>State Tax Withholdings:</span>
              <span className="font-medium">{formatCurrency(taxData?.withholdings?.stateTax || 0)}</span>
            </div>
          )}
          
          {/* State Tax Breakdown */}
          {showStateTaxDetails && stateTaxResult && (
            <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50/20">
              <div className="flex items-center mb-3">
                <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                <span className="font-medium text-orange-800">{stateTaxResult.stateName} Tax Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span>Tax Type:</span>
                    <span className="font-medium">{stateTaxResult.taxType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span className="font-medium">{formatCurrency(stateTaxResult.taxableIncome)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Effective Rate:</span>
                    <span className="font-medium">{formatPercentage(stateTaxResult.effectiveRate / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marginal Rate:</span>
                    <span className="font-medium">{formatPercentage(stateTaxResult.marginalRate / 100)}</span>
                  </div>
                </div>
              </div>
              {stateTaxResult.credits && stateTaxResult.credits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <span className="text-sm font-medium text-orange-800">Credits Applied:</span>
                  {stateTaxResult.credits.map((credit, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{credit.name}:</span>
                      <span className="text-green-600">-{formatCurrency(credit.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <Separator />
          {comprehensiveTaxResult?.phases.phase11_FinalBalance ? (
            <>
              <div className="flex justify-between font-bold text-lg">
                <span>{comprehensiveTaxResult.phases.phase11_FinalBalance.finalStatus === 'refund' ? 'Federal Refund:' : 'Federal Amount Owed:'}</span>
                <span className={comprehensiveTaxResult.phases.phase11_FinalBalance.finalStatus === 'refund' ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(comprehensiveTaxResult.phases.phase11_FinalBalance.finalStatus === 'refund' 
                    ? comprehensiveTaxResult.phases.phase11_FinalBalance.refundAmount 
                    : comprehensiveTaxResult.phases.phase11_FinalBalance.balanceDue)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-bold text-lg">
              <span>{taxData.taxCalculation.refund >= 0 ? 'Federal Refund' : 'Federal Amount Owed'}:</span>
              <span className={taxData.taxCalculation.refund >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(Math.abs(taxData.taxCalculation.refund))}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-muted-foreground">No documents uploaded</p>
            ) : (
              documents.map((doc, index) => {
                console.log('📄 Document structure:', doc); // Debug log
                const displayName = doc.filename || doc.name || doc.originalFilename || `Document ${index + 1}`;
                const docType = doc.documentType || 'Unknown';
                const confidence = (doc.confidence || 0) * 100;
                
                return (
                  <div key={doc.id || index} className="flex justify-between items-center p-2 border rounded">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <div>
                        <div className="text-sm font-medium">{displayName}</div>
                        <div className="text-xs text-muted-foreground">{docType}</div>
                      </div>
                    </div>
                    <Badge variant={confidence > 0 ? "default" : "secondary"}>
                      {confidence > 0 ? `${confidence.toFixed(1)}% confidence` : 'No data extracted'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Before You Proceed</h3>
            <ul className="text-yellow-700 text-sm mt-2 space-y-1">
              <li>• Double-check all personal information for accuracy</li>
              <li>• Verify all income amounts match your tax documents</li>
              <li>• Ensure your filing status is correct</li>
              <li>• Review deduction choices for maximum benefit</li>
              <li>• All calculations use current IRS tax brackets and rules</li>
              <li>• This is a demonstration - not actual tax filing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
