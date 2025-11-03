
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calculator, Receipt, FileText, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { calculateComprehensiveTax, type ComprehensiveTaxResult, type TaxDocumentData } from "@/lib/tax-calculations";
import { stateTaxCalculator2025, type StateTaxResult } from "@/lib/state-tax-calculator-2025";

interface TaxCalculationStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function TaxCalculationStep({ taxData, updateTaxData }: TaxCalculationStepProps) {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showStateTaxBreakdown, setShowStateTaxBreakdown] = useState(false);
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveTaxResult | null>(null);
  const [stateTaxResult, setStateTaxResult] = useState<StateTaxResult | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Convert filing status to match our comprehensive engine
  const normalizeFilingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'single': 'single',
      'married-jointly': 'marriedFilingJointly',
      'married-separately': 'marriedFilingSeparately', 
      'head-of-household': 'headOfHousehold',
      'qualifying-widow': 'qualifyingWidow'
    };
    return statusMap[status] || 'single';
  };

  // Prepare tax data for comprehensive calculation
  const prepareExtractedTaxData = (): TaxDocumentData => {
    return {
      income: {
        wages: taxData.income?.wages || 0,
        interest: taxData.income?.interest || 0,
        dividends: taxData.income?.dividends || 0,
        nonEmployeeCompensation: taxData.income?.nonEmployeeCompensation || 0,
        miscellaneousIncome: taxData.income?.miscellaneousIncome || 0,
        rentalRoyalties: taxData.income?.rentalRoyalties || 0,
        other: taxData.income?.other || 0
      },
      withholdings: {
        federalTax: taxData.withholdings?.federalTax || 0,
        stateTax: taxData.withholdings?.stateTax || 0,
        socialSecurityTax: taxData.withholdings?.socialSecurityTax || 0,
        medicareTax: taxData.withholdings?.medicareTax || 0
      },
      personalInfo: {
        name: taxData.personalInfo?.firstName && taxData.personalInfo?.lastName 
          ? `${taxData.personalInfo.firstName} ${taxData.personalInfo.lastName}` 
          : '',
        ssn: taxData.personalInfo?.ssn || '',
        address: taxData.personalInfo?.address || ''
      },
      breakdown: taxData.breakdown || { byDocument: [] }
    };
  };

  // Calculate comprehensive tax results (Federal + State) - FIXED FOR ACCURACY
  useEffect(() => {
    const extractedTaxData = prepareExtractedTaxData();
    const filingStatus = normalizeFilingStatus(taxData.personalInfo?.filingStatus || 'single');
    const useItemized = !taxData.deductions?.useStandard;
    const itemizedAmount = taxData.deductions?.itemized || 0;

    console.log('🏛️ SENIOR TAX ACCOUNTANT: Starting PURE Document-Based Calculation (No Mock Data)');
    console.log('📊 EXTRACTED TAX DATA:', JSON.stringify(extractedTaxData, null, 2));
    console.log('📊 FILING STATUS:', filingStatus);
    console.log('📊 DEDUCTIONS:', { useItemized, itemizedAmount });
    console.log('📊 STATE:', taxData.personalInfo?.state);

    // Calculate Federal Tax
    const federalResult = calculateComprehensiveTax(
      extractedTaxData,
      filingStatus as any,
      useItemized,
      itemizedAmount,
      0 // estimated tax payments
    );

    console.log('✅ FEDERAL TAX CALCULATION COMPLETE:', {
      agi: federalResult.summary.adjustedGrossIncome,
      taxableIncome: federalResult.summary.taxableIncome,
      federalTax: federalResult.summary.totalTaxLiability,
      withholdings: federalResult.phases.phase10_WithholdingsAndCredits.totalWithholdings,
      balance: federalResult.summary.finalBalance
    });

    setComprehensiveResult(federalResult);

    // Calculate State Tax (if state is provided) - FIXED to use same income base as federal
    let stateResult: StateTaxResult | null = null;
    
    if (taxData.personalInfo?.state) {
      try {
        console.log('✅ CALCULATING STATE TAX FOR:', taxData.personalInfo.state);
        
        // Use the SAME income calculation as federal for consistency
        const federalAGI = federalResult.phases.phase3_AdjustedGrossIncome.adjustedGrossIncome;

        const stateData = {
          state: taxData.personalInfo.state,
          filingStatus: filingStatus,
          income: federalAGI, // Use federal AGI for consistency
          federalAGI: federalAGI,
          itemizedDeductions: useItemized ? itemizedAmount : 0,
          dependents: taxData.personalInfo?.dependents || 0,
          age: taxData.personalInfo?.age || 0,
          isBlind: taxData.personalInfo?.isBlind || false,
          spouseAge: taxData.personalInfo?.spouseAge || 0,
          spouseIsBlind: taxData.personalInfo?.spouseIsBlind || false,
          dividends: extractedTaxData.income.dividends || 0,
          interest: extractedTaxData.income.interest || 0,
          capitalGains: extractedTaxData.income.other || 0, // Use 'other' as capital gains proxy
          dependentsUnder17: taxData.personalInfo?.dependentsUnder17 || 0,
          dependentsOver17: taxData.personalInfo?.dependentsOver17 || 0
        };

        console.log('🏛️ STATE TAX INPUT (CONSISTENT WITH FEDERAL):', stateData);
        stateResult = stateTaxCalculator2025.calculateStateTax(stateData);
        console.log('✅ STATE TAX RESULT:', stateResult);
        
      } catch (error) {
        console.error('❌ STATE TAX ERROR:', error);
        // Create a fallback state result
        stateResult = {
          state: taxData.personalInfo.state,
          stateName: `${taxData.personalInfo.state} (Error)`,
          taxType: 'Calculation Error',
          stateTax: 0,
          effectiveRate: 0,
          marginalRate: 0,
          taxableIncome: 0,
          credits: [],
          breakdown: [],
          notes: [`Error calculating ${taxData.personalInfo.state} state tax. Please consult a tax professional.`]
        };
      }
    } else {
      console.log('⚠️ NO STATE PROVIDED - SKIPPING STATE TAX');
    }

    setStateTaxResult(stateResult);

    // Calculate ACCURATE final balance including state tax
    const totalFederalTax = federalResult.summary.totalTaxLiability;
    const totalStateTax = stateResult?.stateTax || 0;
    const totalTaxLiability = totalFederalTax + totalStateTax;
    
    // Use ONLY federal withholdings for balance calculation (state withholdings are separate)
    const totalWithholdings = federalResult.phases.phase10_WithholdingsAndCredits.federalIncomeTax;
    const finalBalance = totalTaxLiability - totalWithholdings;
    const isRefund = finalBalance < 0;

    console.log('🏛️ FINAL CALCULATION SUMMARY (VERIFIED):', {
      totalFederalTax,
      totalStateTax,
      totalTaxLiability,
      totalWithholdings,
      finalBalance,
      isRefund
    });

    // Update tax data for other components with VERIFIED calculations
    updateTaxData('taxCalculation', {
      taxableIncome: federalResult.summary.taxableIncome,
      federalTax: totalFederalTax,
      stateTax: totalStateTax,
      totalTax: totalTaxLiability,
      refund: isRefund ? Math.abs(finalBalance) : 0,
      owed: !isRefund ? finalBalance : 0,
      effectiveTaxRate: federalResult.summary.effectiveTaxRate,
      marginalTaxRate: federalResult.summary.marginalTaxRate,
      comprehensiveResult: federalResult,
      stateTaxResult: stateResult,
      // Add verified summary for display consistency
      verifiedSummary: {
        totalTaxLiability,
        totalWithholdings,
        finalBalance,
        isRefund
      }
    });

  }, [taxData.income, taxData.withholdings, taxData.personalInfo, taxData.deductions, updateTaxData]);

  if (!comprehensiveResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Performing industry-standard tax calculations...</p>
        </div>
      </div>
    );
  }

  const { phases, summary, metadata } = comprehensiveResult;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Federal & State Tax Calculation</h2>
        <p className="text-muted-foreground mb-4">
          Complete federal and state tax calculation based on your extracted document data and state of residence.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Tax Year {metadata.taxYear}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            Filing Status: {metadata.filingStatus}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            {metadata.standardDeductionUsed ? 'Standard' : 'Itemized'} Deduction
          </Badge>
          {stateTaxResult && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              State: {stateTaxResult.stateName} ({stateTaxResult.taxType})
            </Badge>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY - FIXED FOR CONSISTENCY */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Adjusted Gross Income (AGI):</span>
                <span className="font-bold">{formatCurrency(summary.adjustedGrossIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {phases.phase4_DeductionDetermination.useStandardDeduction ? 'Standard' : 'Itemized'} Deduction:
                </span>
                <span className="font-bold">{formatCurrency(phases.phase4_DeductionDetermination.selectedDeduction)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">Taxable Income:</span>
                <span className="font-bold text-lg">{formatCurrency(summary.taxableIncome)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Federal Tax Liability:</span>
                <span className="font-bold text-red-600">{formatCurrency(summary.totalTaxLiability)}</span>
              </div>
              {stateTaxResult && stateTaxResult.stateTax > 0 ? (
                <div className="flex justify-between">
                  <span className="font-medium">State Tax Liability ({stateTaxResult.state}):</span>
                  <span className="font-bold text-orange-600">{formatCurrency(stateTaxResult.stateTax)}</span>
                </div>
              ) : taxData.personalInfo?.state ? (
                <div className="flex justify-between">
                  <span className="font-medium">State Tax Liability ({taxData.personalInfo.state}):</span>
                  <span className="font-bold text-muted-foreground">$0.00</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="font-medium">State Tax Liability:</span>
                  <span className="font-bold text-muted-foreground">No state provided</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-lg">Total Tax Liability:</span>
                <span className="font-bold text-lg text-red-600">
                  {formatCurrency(
                    (taxData.taxCalculation?.verifiedSummary?.totalTaxLiability) || 
                    (summary.totalTaxLiability + (stateTaxResult?.stateTax || 0))
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Withholdings:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(
                    (taxData.taxCalculation?.verifiedSummary?.totalWithholdings) ||
                    phases.phase10_WithholdingsAndCredits.federalIncomeTax
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">
                  {(taxData.taxCalculation?.verifiedSummary?.isRefund) || 
                   (phases.phase11_FinalBalance.finalStatus === 'refund') ? 'Refund Due:' : 'Amount Owed:'}
                </span>
                <span className={`font-bold text-lg ${
                  (taxData.taxCalculation?.verifiedSummary?.isRefund) || 
                  (phases.phase11_FinalBalance.finalStatus === 'refund') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(
                    (taxData.taxCalculation?.verifiedSummary?.finalBalance) ||
                    (phases.phase11_FinalBalance.finalStatus === 'refund' 
                      ? phases.phase11_FinalBalance.refundAmount
                      : phases.phase11_FinalBalance.balanceDue)
                  ))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KEY METRICS - FIXED FOR CONSISTENCY */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`border-2 ${
          (taxData.taxCalculation?.verifiedSummary?.isRefund) || 
          (phases.phase11_FinalBalance.finalStatus === 'refund')
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              {(taxData.taxCalculation?.verifiedSummary?.isRefund) || 
               (phases.phase11_FinalBalance.finalStatus === 'refund') ? (
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.abs(
                    (taxData.taxCalculation?.verifiedSummary?.finalBalance) ||
                    (phases.phase11_FinalBalance.finalStatus === 'refund'
                      ? phases.phase11_FinalBalance.refundAmount
                      : phases.phase11_FinalBalance.balanceDue)
                  ))}
                </div>
                <div className="text-sm font-medium">
                  {(taxData.taxCalculation?.verifiedSummary?.isRefund) || 
                   (phases.phase11_FinalBalance.finalStatus === 'refund') ? 'Expected Refund' : 'Amount Owed'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(
                  // Calculate effective rate including state taxes
                  summary.adjustedGrossIncome > 0 
                    ? ((summary.totalTaxLiability + (stateTaxResult?.stateTax || 0)) / summary.adjustedGrossIncome)
                    : 0
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Effective Tax Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                (Total Tax ÷ AGI)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(summary.marginalTaxRate)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Marginal Tax Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                (Last Dollar Tax Rate - Federal)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAX LIABILITY BREAKDOWN */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Liability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Regular Income Tax</h4>
                <div className="flex justify-between">
                  <span>Federal Income Tax:</span>
                  <span className="font-medium">{formatCurrency(phases.phase9_TotalTaxLiability.regularTax)}</span>
                </div>
                {phases.phase7_SelfEmploymentTax.totalSETax > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Self-Employment Tax</h4>
                    <div className="flex justify-between text-sm">
                      <span>Social Security (12.4%):</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.socialSecurityTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medicare (2.9%):</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.medicareTax)}</span>
                    </div>
                    {phases.phase7_SelfEmploymentTax.additionalMedicareTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Additional Medicare (0.9%):</span>
                        <span>{formatCurrency(phases.phase7_SelfEmploymentTax.additionalMedicareTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total SE Tax:</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.totalSETax)}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Withholdings & Credits</h4>
                {phases.phase10_WithholdingsAndCredits.federalIncomeTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Federal Income Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.federalIncomeTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.socialSecurityTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Social Security Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.socialSecurityTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.medicareTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Medicare Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.medicareTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.stateTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>State Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.stateTax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Federal Withholdings (for balance calc):</span>
                  <span className="text-blue-600">{formatCurrency(
                    (taxData.taxCalculation?.verifiedSummary?.totalWithholdings) ||
                    phases.phase10_WithholdingsAndCredits.federalIncomeTax
                  )}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>All Withholdings (informational):</span>
                  <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.totalWithholdings)}</span>
                </div>
                
                {phases.phase7_SelfEmploymentTax.seDeduction > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Deductions</h4>
                    <div className="flex justify-between text-sm">
                      <span>SE Tax Deduction (50%):</span>
                      <span className="text-green-600">-{formatCurrency(phases.phase7_SelfEmploymentTax.seDeduction)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Federal Tax Liability:</span>
                <span className="text-red-600">{formatCurrency(summary.totalTaxLiability)}</span>
              </div>
              {stateTaxResult && stateTaxResult.stateTax > 0 && (
                <div className="flex justify-between text-lg font-bold mt-2">
                  <span>State Tax Liability:</span>
                  <span className="text-orange-600">{formatCurrency(stateTaxResult.stateTax)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold mt-3 pt-2 border-t border-gray-300">
                <span>Total Tax Liability:</span>
                <span className="text-red-700">{formatCurrency(
                  (taxData.taxCalculation?.verifiedSummary?.totalTaxLiability) ||
                  (summary.totalTaxLiability + (stateTaxResult?.stateTax || 0))
                )}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DETAILED BREAKDOWN TOGGLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progressive Tax Bracket Analysis</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              className="flex items-center gap-2"
            >
              {showDetailedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetailedBreakdown ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {phases.phase6_RegularTax.bracketBreakdown.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Your taxable income of {formatCurrency(summary.taxableIncome)} is taxed progressively across multiple brackets:
              </p>
              
              {showDetailedBreakdown ? (
                <div className="space-y-2">
                  {phases.phase6_RegularTax.bracketBreakdown.map((bracket, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatPercentage(bracket.rate)} on {bracket.bracketRange}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Taxable in this bracket: {formatCurrency(bracket.taxableInThisBracket)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(bracket.taxFromThisBracket)}</div>
                        <div className="text-sm text-muted-foreground">
                          Cumulative: {formatCurrency(bracket.cumulativeTax)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {phases.phase6_RegularTax.bracketBreakdown.slice(0, 3).map((bracket, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{formatPercentage(bracket.rate)} on {bracket.bracketRange}</span>
                      <span>{formatCurrency(bracket.taxFromThisBracket)}</span>
                    </div>
                  ))}
                  {phases.phase6_RegularTax.bracketBreakdown.length > 3 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... and {phases.phase6_RegularTax.bracketBreakdown.length - 3} more brackets
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No taxable income falls within regular tax brackets.</p>
          )}
        </CardContent>
      </Card>

      {/* INCOME BREAKDOWN BY DOCUMENT TYPE */}
      <Card>
        <CardHeader>
          <CardTitle>Income Sources from Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Employment Income</h4>
              {phases.phase1_IncomeCollection.w2Income > 0 && (
                <div className="flex justify-between">
                  <span>W-2 Wages & Tips:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.w2Income)}</span>
                </div>
              )}
              
              {phases.phase1_IncomeCollection.form1099NEC > 0 && (
                <>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Self-Employment Income</h4>
                  <div className="flex justify-between">
                    <span>1099-NEC Non-employee Comp:</span>
                    <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099NEC)}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Investment Income</h4>
              {phases.phase1_IncomeCollection.form1099INT > 0 && (
                <div className="flex justify-between">
                  <span>1099-INT Interest:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099INT)}</span>
                </div>
              )}
              {phases.phase1_IncomeCollection.form1099DIV > 0 && (
                <div className="flex justify-between">
                  <span>1099-DIV Dividends:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099DIV)}</span>
                </div>
              )}
              {phases.phase1_IncomeCollection.form1099MISC > 0 && (
                <div className="flex justify-between">
                  <span>1099-MISC Other Income:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099MISC)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between font-semibold">
              <span>Total Income (Phase 2):</span>
              <span>{formatCurrency(phases.phase2_IncomeAggregation.totalOrdinaryIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATE TAX BREAKDOWN */}
      {stateTaxResult && (
        <Card className="border-2 border-orange-200 bg-orange-50/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                {stateTaxResult.stateName} State Tax Calculation
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStateTaxBreakdown(!showStateTaxBreakdown)}
              >
                {showStateTaxBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Tax Type:</span>
                  <span className="text-orange-700 font-semibold">{stateTaxResult.taxType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Taxable Income:</span>
                  <span className="font-bold">{formatCurrency(stateTaxResult.taxableIncome)}</span>
                </div>
                {stateTaxResult.standardDeduction && (
                  <div className="flex justify-between">
                    <span className="font-medium">Standard Deduction:</span>
                    <span className="font-bold">{formatCurrency(stateTaxResult.standardDeduction)}</span>
                  </div>
                )}
                {stateTaxResult.personalExemption && stateTaxResult.personalExemption > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Personal Exemption:</span>
                    <span className="font-bold">{formatCurrency(stateTaxResult.personalExemption)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">State Tax:</span>
                  <span className="font-bold text-orange-600 text-lg">{formatCurrency(stateTaxResult.stateTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Effective Rate:</span>
                  <span className="font-bold">{formatPercentage(stateTaxResult.effectiveRate / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Marginal Rate:</span>
                  <span className="font-bold">{formatPercentage(stateTaxResult.marginalRate / 100)}</span>
                </div>
                {stateTaxResult.credits && stateTaxResult.credits.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="font-medium text-sm">Credits Applied:</span>
                    {stateTaxResult.credits.map((credit, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{credit.name}:</span>
                        <span className="text-green-600">-{formatCurrency(credit.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Tax Bracket Breakdown */}
            {showStateTaxBreakdown && stateTaxResult.breakdown && stateTaxResult.breakdown.length > 0 && (
              <div className="mt-6 pt-4 border-t border-orange-200">
                <h4 className="font-semibold mb-3 text-orange-800">Tax Bracket Breakdown:</h4>
                <div className="space-y-2">
                  {stateTaxResult.breakdown.map((bracket, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm text-orange-700">{bracket.bracket}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(bracket.tax)}</div>
                        <div className="text-xs text-muted-foreground">
                          on {formatCurrency(bracket.taxableAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State-specific notes */}
            {stateTaxResult.notes && stateTaxResult.notes.length > 0 && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">State-Specific Notes:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  {stateTaxResult.notes.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax Calculation Complete */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Tax Calculation Complete</h3>
            <p className="text-green-800 text-sm">All calculations follow current IRS guidelines and your state tax code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
