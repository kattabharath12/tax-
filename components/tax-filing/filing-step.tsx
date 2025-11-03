
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, FileText, Download, Send, Calculator, DollarSign, TrendingUp, Percent } from "lucide-react";
import { calculateComprehensiveTax, ComprehensiveTaxResult } from "@/lib/tax-calculations";
import { stateTaxCalculator2025, type StateTaxResult } from "@/lib/state-tax-calculator-2025";
import Link from "next/link";

interface FilingStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function FilingStep({ taxData }: FilingStepProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [comprehensiveTaxResult, setComprehensiveTaxResult] = useState<ComprehensiveTaxResult | null>(null);
  const [stateTaxResult, setStateTaxResult] = useState<StateTaxResult | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(true);
  const [confirmationNumber, setConfirmationNumber] = useState('');

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Calculate comprehensive tax using industry-standard engine
  useEffect(() => {
    const calculateTax = () => {
      try {
        setCalculationLoading(true);
        
        // Convert taxData to the expected TaxDocumentData format - ONLY using extracted PDF data
        const extractedTaxData = {
          income: {
            wages: taxData?.income?.wages || 0,
            interest: taxData?.income?.interest || 0,
            dividends: taxData?.income?.dividends || 0,
            nonEmployeeCompensation: taxData?.income?.nonEmployeeCompensation || 0,
            miscellaneousIncome: taxData?.income?.other || 0,
            rentalRoyalties: taxData?.income?.rentalRoyalties || 0,
            other: taxData?.income?.miscellaneousIncome || 0
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
        
        console.log('🏛️ SENIOR TAX ACCOUNTANT: Using ONLY extracted PDF data for calculation:', extractedTaxData);

        const result = calculateComprehensiveTax(
          extractedTaxData,
          taxData?.personalInfo?.filingStatus || 'single',
          false,
          0,
          0
        );

        setComprehensiveTaxResult(result);
        
        // Calculate State Tax (if state is provided)
        let stateResult: StateTaxResult | null = null;
        console.log('🔍 FILING STATE DEBUG - State:', taxData?.personalInfo?.state);
        
        if (taxData?.personalInfo?.state) {
          try {
            console.log('✅ FILING: State provided, calculating state tax for:', taxData.personalInfo.state);
            
            const totalIncome = (taxData.income?.wages || 0) + 
                               (taxData.income?.interest || 0) + 
                               (taxData.income?.dividends || 0) + 
                               (taxData.income?.other || 0);

            const stateData = {
              state: taxData.personalInfo.state,
              filingStatus: taxData?.personalInfo?.filingStatus || 'single',
              income: totalIncome,
              federalAGI: result.phases.phase3_AdjustedGrossIncome.adjustedGrossIncome,
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

            console.log('🏛️ FILING State Tax Input Data:', stateData);
            stateResult = stateTaxCalculator2025.calculateStateTax(stateData);
            console.log('🎯 FILING State Tax Result:', stateResult);
            
          } catch (stateError) {
            console.error('❌ FILING State tax calculation failed:', stateError);
            console.error('Stack trace:', (stateError as Error)?.stack);
          }
        } else {
          console.log('⚠️ FILING: No state provided - skipping state tax calculation');
        }

        setStateTaxResult(stateResult);
        console.log('✅ FILING Tax calculation complete - Federal:', result, 'State:', stateResult);
        
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

  const handleSubmit = () => {
    // Generate a realistic confirmation number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    setConfirmationNumber(`TR-2024-${timestamp}${random}`);
    setIsSubmitted(true);
  };

  const handleDownload = async () => {
    try {
      setCalculationLoading(true);
      
      // Prepare personal information for F1040 generation
      const personalInfo = {
        firstName: taxData?.personalInfo?.firstName || '',
        lastName: taxData?.personalInfo?.lastName || '',
        ssn: taxData?.personalInfo?.ssn || '',
        filingStatus: taxData?.personalInfo?.filingStatus || 'single',
        address: taxData?.personalInfo?.address || '',
        city: taxData?.personalInfo?.city || '',
        state: taxData?.personalInfo?.state || '',
        zipCode: taxData?.personalInfo?.zipCode || '',
        occupation: taxData?.personalInfo?.occupation || '',
        dependents: taxData?.personalInfo?.dependents || []
      };

      console.log('🏛️ SENIOR TAX ACCOUNTANT: Requesting comprehensive F1040 PDF generation');
      console.log('📋 Personal Info:', personalInfo);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/download-f1040', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalInfo
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Server error response:', errorData);
        } catch (jsonError) {
          console.error('❌ Failed to parse error response as JSON:', jsonError);
          const textResponse = await response.text();
          console.error('❌ Raw error response:', textResponse);
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        console.error('❌ Response is not a PDF. Content-Type:', contentType);
        const textResponse = await response.text();
        console.error('❌ Response body:', textResponse);
        throw new Error('Server did not return a PDF file');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      console.log('📄 PDF blob size:', pdfBlob.size, 'bytes');
      
      if (pdfBlob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with taxpayer name
      const fileName = `F1040_${personalInfo.firstName || 'Taxpayer'}_${personalInfo.lastName || 'Return'}_2025.pdf`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('✅ SENIOR SOFTWARE DEVELOPER: F1040 PDF downloaded successfully');
      
      // Show success message
      alert(`✅ F1040 tax return downloaded successfully as ${fileName}`);
      
    } catch (error) {
      console.error('❌ SENIOR SOFTWARE DEVELOPER: F1040 PDF download error:', error);
      
      let userMessage = 'Failed to download F1040 PDF. ';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          userMessage += 'Request timed out. Please try again.';
        } else if (error.message.includes('No processed documents')) {
          userMessage += 'Please upload and process your tax documents first.';
        } else if (error.message.includes('Server did not return a PDF')) {
          userMessage += 'Server error occurred. Please try again in a few minutes.';
        } else {
          userMessage += error.message;
        }
      } else {
        userMessage += 'Unknown error occurred.';
      }
      
      alert(`❌ ${userMessage}`);
    } finally {
      setCalculationLoading(false);
    }
  };

  if (calculationLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing your tax return for filing...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-green-800">Tax Return Filed Successfully!</h2>
          <p className="text-muted-foreground">
            Your 2025 tax return has been submitted. Here's your confirmation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-700">Filing Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Confirmation #: {confirmationNumber}
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Filing Details</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Tax Year:</span>
                    <span className="font-medium">2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filing Status:</span>
                    <span className="font-medium capitalize">
                      {taxData?.personalInfo?.filingStatus?.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()) || 'Single'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <span className="font-medium">{formatDate(new Date())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Method:</span>
                    <span className="font-medium">Electronic Filing</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Tax Summary</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Adjusted Gross Income:</span>
                    <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.adjustedGrossIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.taxableIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Federal Tax Liability:</span>
                    <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.totalTaxLiability || 0)}</span>
                  </div>
                  {stateTaxResult && stateTaxResult.stateTax > 0 && (
                    <div className="flex justify-between">
                      <span>State Tax Liability ({stateTaxResult.state}):</span>
                      <span className="font-medium">{formatCurrency(stateTaxResult.stateTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Tax Liability:</span>
                    <span className="font-semibold">{formatCurrency((comprehensiveTaxResult?.summary.totalTaxLiability || 0) + (stateTaxResult?.stateTax || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Federal Withholdings:</span>
                    <span className="font-medium">{formatCurrency(taxData?.withholdings?.federalTax || 0)}</span>
                  </div>
                  {taxData?.withholdings?.stateTax > 0 && (
                    <div className="flex justify-between">
                      <span>State Withholdings:</span>
                      <span className="font-medium">{formatCurrency(taxData.withholdings.stateTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Withholdings:</span>
                    <span className="font-semibold">{formatCurrency((taxData?.withholdings?.federalTax || 0) + (taxData?.withholdings?.stateTax || 0))}</span>
                  </div>
                  <Separator />
                  {(() => {
                    // Calculate comprehensive balance including state tax for confirmation
                    const totalTaxLiability = (comprehensiveTaxResult?.summary.totalTaxLiability || 0) + (stateTaxResult?.stateTax || 0);
                    const totalWithholdings = (taxData?.withholdings?.federalTax || 0) + (taxData?.withholdings?.stateTax || 0);
                    const finalBalance = totalTaxLiability - totalWithholdings;
                    const isRefund = finalBalance < 0;
                    const isOwed = finalBalance > 0;
                    
                    return (
                      <div className="flex justify-between font-bold">
                        <span>
                          {isRefund ? 'Refund:' : isOwed ? 'Amount Owed:' : 'Balance:'}
                        </span>
                        <span className={
                          isRefund ? 'text-green-600' : isOwed ? 'text-red-600' : 'text-gray-600'
                        }>
                          {formatCurrency(Math.abs(finalBalance))}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Tax Rate Information */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-semibold text-sm">Marginal Tax Rate</span>
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {formatPercentage(comprehensiveTaxResult?.summary.marginalTaxRate || 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Percent className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-sm">Effective Tax Rate</span>
                </div>
                <div className="text-xl font-bold text-green-600">
                  {formatPercentage(comprehensiveTaxResult?.summary.effectiveTaxRate || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleDownload} 
            variant="outline"
            disabled={calculationLoading}
            className="min-w-[160px]"
          >
            {calculationLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {calculationLoading ? "Generating..." : "Download Tax Return"}
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Print Confirmation
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">What Happens Next?</h3>
          <ul className="text-green-800 text-sm space-y-1">
            <li>• Your return will be processed by the IRS within 21 days</li>
            <li>• You'll receive an email confirmation once processing begins</li>
            <li>• If due a refund, it will be direct deposited within 21 days</li>
            <li>• If you owe taxes, payment is due by the filing deadline</li>
            <li>• Keep a copy of your tax return and this confirmation for your records</li>
            <li>• Check IRS.gov or call 1-800-829-1040 for status updates</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Important Reminders</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Save this confirmation number: <strong>{confirmationNumber}</strong></li>
            <li>• Your tax return was calculated using IRS-approved methods</li>
            <li>• All calculations follow current federal tax brackets and regulations</li>
            <li>• This is a demonstration system - actual filing would go to the IRS</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ready to File</h2>
        <p className="text-muted-foreground">
          Your tax return is complete and ready to be filed. Review the summary below and submit when ready.
        </p>
      </div>

      {/* Pre-Filing Summary with Industry-Standard Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Comprehensive Filing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Taxpayer Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Taxpayer Information
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{taxData?.personalInfo?.firstName} {taxData?.personalInfo?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filing Status:</span>
                  <span className="font-medium capitalize">
                    {taxData?.personalInfo?.filingStatus?.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()) || 'Single'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dependents:</span>
                  <span className="font-medium">{taxData?.personalInfo?.dependents || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Income Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Total Income:</span>
                  <span className="font-medium">{formatCurrency(
                    (taxData?.income?.wages || 0) + 
                    (taxData?.income?.interest || 0) + 
                    (taxData?.income?.dividends || 0) + 
                    (taxData?.income?.other || 0)
                  )}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjusted Gross Income:</span>
                  <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.adjustedGrossIncome || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Income:</span>
                  <span className="font-medium">{formatCurrency(comprehensiveTaxResult?.summary.taxableIncome || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Industry-Standard Tax Calculation Display */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tax Calculation Breakdown</h3>
            
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(comprehensiveTaxResult?.summary.adjustedGrossIncome || 0)}
                </div>
                <div className="text-sm text-blue-600">Adjusted Gross Income</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-700">
                  -{formatCurrency(comprehensiveTaxResult?.phases.phase4_DeductionDetermination.selectedDeduction || 0)}
                </div>
                <div className="text-sm text-purple-600">Standard Deduction</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(comprehensiveTaxResult?.summary.taxableIncome || 0)}
                </div>
                <div className="text-sm text-green-600">Taxable Income</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-red-700">
                  {formatCurrency(comprehensiveTaxResult?.summary.totalTaxLiability || 0)}
                </div>
                <div className="text-sm text-red-600">Federal Tax Liability</div>
                {stateTaxResult && stateTaxResult.stateTax > 0 && (
                  <div className="mt-1">
                    <div className="text-sm font-bold text-orange-700">
                      +{formatCurrency(stateTaxResult.stateTax)}
                    </div>
                    <div className="text-xs text-orange-600">State Tax Liability ({stateTaxResult.state})</div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">
                  -{formatCurrency(taxData?.withholdings?.federalTax || 0)}
                </div>
                <div className="text-sm text-blue-600">Federal Withholdings</div>
                {(taxData?.withholdings?.stateTax || 0) > 0 && (
                  <div className="mt-1">
                    <div className="text-sm font-bold text-purple-700">
                      -{formatCurrency(taxData.withholdings.stateTax)}
                    </div>
                    <div className="text-xs text-purple-600">State Withholdings</div>
                  </div>
                )}
              </div>
              <div className="text-center">
                {(() => {
                  // Calculate comprehensive balance including state tax
                  const totalTaxLiability = (comprehensiveTaxResult?.summary.totalTaxLiability || 0) + (stateTaxResult?.stateTax || 0);
                  const totalWithholdings = (taxData?.withholdings?.federalTax || 0) + (taxData?.withholdings?.stateTax || 0);
                  const finalBalance = totalTaxLiability - totalWithholdings;
                  const isRefund = finalBalance < 0;
                  const isOwed = finalBalance > 0;
                  
                  return (
                    <>
                      <div className={`text-lg font-bold ${
                        isRefund ? 'text-green-700' : isOwed ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {formatCurrency(Math.abs(finalBalance))}
                      </div>
                      <div className={`text-sm ${
                        isRefund ? 'text-green-600' : isOwed ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {isRefund ? 'Your Refund' : isOwed ? 'Amount Owed' : 'Balance'}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tax Rates */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-semibold">Marginal Tax Rate</span>
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {formatPercentage(comprehensiveTaxResult?.summary.marginalTaxRate || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Rate on next dollar earned</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Percent className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold">Effective Tax Rate</span>
                </div>
                <div className="text-xl font-bold text-green-600">
                  {formatPercentage(comprehensiveTaxResult?.summary.effectiveTaxRate || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Average rate on all income</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
        <div className="text-yellow-700 text-sm space-y-2">
          <p>
            This is a demonstration of the tax filing process. In a real tax application, 
            your return would be electronically filed with the IRS using their approved systems.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>All calculations follow current IRS tax brackets and regulations</li>
            <li>Tax calculations are performed using industry-standard methodologies</li>
            <li>Effective and marginal tax rates are computed according to federal guidelines</li>
            <li>Final balance accounts for all withholdings and tax liabilities</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSubmit} size="lg" className="px-8">
          <Send className="w-5 h-5 mr-2" />
          Submit Tax Return
        </Button>
      </div>
    </div>
  );
}
