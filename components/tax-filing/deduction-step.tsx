
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DeductionStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function DeductionStep({ taxData, updateTaxData }: DeductionStepProps) {
  const handleDeductionChange = (field: string, value: string | number | boolean) => {
    updateTaxData('deductions', {
      [field]: value,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Standard deduction amounts for 2023
  const standardDeductionAmounts = {
    single: 13850,
    'married-jointly': 27700,
    'married-separately': 13850,
    'head-of-household': 20800,
    'qualifying-widow': 27700,
  };

  const filingStatus = taxData.personalInfo.filingStatus || 'single';
  const standardDeduction = standardDeductionAmounts[filingStatus as keyof typeof standardDeductionAmounts] || 13850;

  const recommendedDeduction = taxData.deductions.itemized > standardDeduction ? 'itemized' : 'standard';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Deductions</h2>
        <p className="text-muted-foreground">
          Choose between standard and itemized deductions. We'll recommend the option that gives you the larger deduction.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduction Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={taxData.deductions.useStandard ? 'standard' : 'itemized'}
            onValueChange={(value) => handleDeductionChange('useStandard', value === 'standard')}
          >
            <div className="flex items-center space-x-2 p-4 border rounded">
              <RadioGroupItem value="standard" id="standard" />
              <div className="flex-1">
                <Label htmlFor="standard" className="text-base font-medium">
                  Standard Deduction
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(standardDeduction)} for {filingStatus.replace('-', ' ')} filers
                </p>
              </div>
              {recommendedDeduction === 'standard' && (
                <div className="text-green-600 text-sm font-medium">Recommended</div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded">
              <RadioGroupItem value="itemized" id="itemized" />
              <div className="flex-1">
                <Label htmlFor="itemized" className="text-base font-medium">
                  Itemized Deductions
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(taxData.deductions.itemized)} total itemized deductions
                </p>
              </div>
              {recommendedDeduction === 'itemized' && (
                <div className="text-green-600 text-sm font-medium">Recommended</div>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {!taxData.deductions.useStandard && (
        <Card>
          <CardHeader>
            <CardTitle>Itemized Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stateAndLocalTax">State and Local Taxes (SALT)</Label>
              <Input
                id="stateAndLocalTax"
                type="number"
                step="0.01"
                defaultValue="0"
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  // Update itemized total (simplified calculation)
                  const newItemized = Math.min(value, 10000); // SALT cap
                  handleDeductionChange('itemized', newItemized);
                }}
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Limited to $10,000 ($5,000 if married filing separately)
              </p>
            </div>

            <div>
              <Label htmlFor="mortgageInterest">Mortgage Interest</Label>
              <Input
                id="mortgageInterest"
                type="number"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="charitableContributions">Charitable Contributions</Label>
              <Input
                id="charitableContributions"
                type="number"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="medicalExpenses">Medical Expenses</Label>
              <Input
                id="medicalExpenses"
                type="number"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Only amounts exceeding 7.5% of your AGI are deductible
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deduction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Standard Deduction:</span>
              <span>{formatCurrency(standardDeduction)}</span>
            </div>
            <div className="flex justify-between">
              <span>Itemized Deductions:</span>
              <span>{formatCurrency(taxData.deductions.itemized)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Selected Deduction:</span>
              <span>
                {formatCurrency(
                  taxData.deductions.useStandard ? standardDeduction : taxData.deductions.itemized
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
