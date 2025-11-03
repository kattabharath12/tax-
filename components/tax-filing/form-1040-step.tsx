
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Form1040StepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Form1040Step({ taxData }: Form1040StepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate key values
  const totalIncome = taxData.income.wages + taxData.income.interest + taxData.income.dividends + taxData.income.other;
  
  const standardDeductionAmounts = {
    single: 13850,
    'married-jointly': 27700,
    'married-separately': 13850,
    'head-of-household': 20800,
    'qualifying-widow': 27700,
  };
  
  const filingStatus = taxData.personalInfo.filingStatus || 'single';
  const standardDeduction = standardDeductionAmounts[filingStatus as keyof typeof standardDeductionAmounts] || 13850;
  const deduction = taxData.deductions.useStandard ? standardDeduction : taxData.deductions.itemized;
  const taxableIncome = Math.max(0, totalIncome - deduction);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Form 1040 Preview</h2>
        <p className="text-muted-foreground">
          Review your Form 1040 with the information you've provided. This is a simplified preview of key lines.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Form 1040 - U.S. Individual Income Tax Return
            <Badge variant="secondary">2023</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Filing Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Name:</span>
                  <span className="text-sm font-medium">
                    {taxData.personalInfo.firstName} {taxData.personalInfo.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">SSN:</span>
                  <span className="text-sm font-medium">
                    {taxData.personalInfo.ssn || 'XXX-XX-XXXX'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Filing Status:</span>
                  <span className="text-sm font-medium capitalize">
                    {taxData.personalInfo.filingStatus.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Dependents:</span>
                  <span className="text-sm font-medium">
                    {taxData.personalInfo.dependents}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Address</h3>
              <p className="text-sm">
                {taxData.personalInfo.address || 'Address not provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Line 1z - Total wages, salaries, tips</span>
            <span className="font-medium">{formatCurrency(taxData.income.wages)}</span>
          </div>
          <div className="flex justify-between">
            <span>Line 2b - Tax-exempt interest</span>
            <span className="font-medium">{formatCurrency(taxData.income.interest)}</span>
          </div>
          <div className="flex justify-between">
            <span>Line 3b - Qualified dividends</span>
            <span className="font-medium">{formatCurrency(taxData.income.dividends)}</span>
          </div>
          <div className="flex justify-between">
            <span>Line 8z - Other income</span>
            <span className="font-medium">{formatCurrency(taxData.income.other)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Line 11 - Adjusted Gross Income</span>
            <span>{formatCurrency(totalIncome)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standard Deduction and Taxable Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Line 12 - Standard/Itemized deduction</span>
            <span className="font-medium">{formatCurrency(deduction)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Line 15 - Taxable Income</span>
            <span>{formatCurrency(taxableIncome)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
        <p className="text-blue-800 text-sm">
          In the next step, we'll calculate your tax liability, credits, and determine if you owe taxes or are due a refund.
        </p>
      </div>
    </div>
  );
}
