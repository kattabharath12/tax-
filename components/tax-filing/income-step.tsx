
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Calculator, Eye, EyeOff } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IncomeStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function IncomeStep({ taxData, documents, updateTaxData }: IncomeStepProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [documentBreakdowns, setDocumentBreakdowns] = useState<any[]>([]);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  useEffect(() => {
    // Extract breakdown information if available
    if (taxData?.breakdown?.byDocument) {
      setDocumentBreakdowns(taxData.breakdown.byDocument);
    }
  }, [taxData]);

  const handleIncomeChange = (field: string, value: string) => {
    // Enhanced input validation for tax accuracy
    const cleanValue = value.replace(/[^0-9.-]/g, ''); // Remove non-numeric characters except decimal and negative
    const numValue = parseFloat(cleanValue) || 0;
    
    // IRS compliance: Round to nearest cent
    const roundedValue = Math.round(numValue * 100) / 100;
    
    updateTaxData('income', {
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

  // Safe filtering with confidence scores
  const relevantDocs = (documents || []).filter(doc => {
    const confidence = doc?.confidence || 0;
    return confidence > 0.1 && doc.extractedData && doc.extractedData.length > 0;
  });

  // Safe calculation with null checks
  const totalIncome = (taxData?.income?.wages || 0) + 
                     (taxData?.income?.interest || 0) + 
                     (taxData?.income?.dividends || 0) + 
                     (taxData?.income?.other || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Income Information</h2>
        <p className="text-muted-foreground">
          Review and modify your income from all sources. Data has been auto-populated from your uploaded documents.
        </p>
      </div>

      {/* Document Source Summary */}
      {relevantDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Source Documents
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showBreakdown ? "Hide Details" : "Show Details"}
                {showBreakdown ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {relevantDocs.map((doc) => {
                const docType = doc.documentType || 'OTHER';
                const fileName = doc.fileName || doc.filename || 'Unknown Document';
                const confidence = Math.round((doc.confidence || 0) * 100);
                const breakdown = documentBreakdowns.find(b => b.id === doc.id);
                
                return (
                  <div key={doc.id} className="border rounded-lg">
                    <div className="flex justify-between items-center p-3">
                      <div className="flex flex-col flex-grow">
                        <span className="font-medium">{fileName}</span>
                        <span className="text-sm text-muted-foreground">
                          {docType.replace('FORM_', '').replace('_', '-')} • {doc.extractedData?.length || 0} fields extracted
                        </span>
                      </div>
                      <Badge variant={confidence >= 70 ? "default" : confidence >= 40 ? "secondary" : "destructive"}>
                        {confidence}% confidence
                      </Badge>
                    </div>
                    
                    {/* Document Breakdown Details */}
                    {showBreakdown && breakdown && breakdown.sources?.length > 0 && (
                      <div className="px-3 pb-3 border-t bg-muted/50">
                        <h4 className="font-medium text-sm text-muted-foreground mt-2 mb-2">
                          Extracted Income Data:
                        </h4>
                        <div className="space-y-1">
                          {breakdown.sources.map((source: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground truncate flex-1">
                                {source.fieldName} → {source.mappedTo}
                              </span>
                              <span className="font-mono ml-2">
                                ${source.amount.toLocaleString()}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {Math.round(source.confidence * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {breakdown.contributedAmounts && Object.keys(breakdown.contributedAmounts).length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-muted-foreground font-medium">Document Contribution:</div>
                            {Object.entries(breakdown.contributedAmounts).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-mono">${(value || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="wages">Wages, Salaries, Tips (W-2)</Label>
            <Input
              id="wages"
              type="number"
              step="0.01"
              value={taxData.income.wages || ''}
              onChange={(e) => handleIncomeChange('wages', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground mt-1">
              From Box 1 of your W-2 form(s)
              {taxData.income.wages > 0 && (
                <span className="text-green-600 font-medium"> • Auto-filled from uploaded documents</span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="interest">Interest Income (1099-INT)</Label>
            <Input
              id="interest"
              type="number"
              step="0.01"
              value={taxData.income.interest || ''}
              onChange={(e) => handleIncomeChange('interest', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground mt-1">
              From Box 1 of your 1099-INT form(s)
              {taxData.income.interest > 0 && (
                <span className="text-green-600 font-medium"> • Auto-filled from uploaded documents</span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="dividends">Dividend Income (1099-DIV)</Label>
            <Input
              id="dividends"
              type="number"
              step="0.01"
              value={taxData.income.dividends || ''}
              onChange={(e) => handleIncomeChange('dividends', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground mt-1">
              From Box 1a of your 1099-DIV form(s)
              {taxData.income.dividends > 0 && (
                <span className="text-green-600 font-medium"> • Auto-filled from uploaded documents</span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="other">Other Income (1099-NEC, 1099-MISC, etc.)</Label>
            <Input
              id="other"
              type="number"
              step="0.01"
              value={taxData.income.other || ''}
              onChange={(e) => handleIncomeChange('other', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Non-employee compensation, miscellaneous income, rental income, royalties, and other taxable income
              {taxData.income.other > 0 && (
                <span className="text-green-600 font-medium"> • Auto-filled from uploaded documents</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Income Summary & Calculation
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              {showCalculationDetails ? "Hide Math" : "Show Math"}
              {showCalculationDetails ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            
            {/* Income Breakdown by Category */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium">W-2 Wages:</span>
                  <span className="text-sm text-muted-foreground block">
                    {documentBreakdowns.filter(doc => 
                      doc.contributedAmounts?.wages > 0
                    ).map(doc => doc.fileName).join(', ') || 'Manual entry'}
                  </span>
                </div>
                <span className="font-mono text-lg">{formatCurrency(taxData.income.wages)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium">Interest Income:</span>
                  <span className="text-sm text-muted-foreground block">
                    {documentBreakdowns.filter(doc => 
                      doc.contributedAmounts?.interest > 0
                    ).map(doc => doc.fileName).join(', ') || 'Manual entry'}
                  </span>
                </div>
                <span className="font-mono text-lg">{formatCurrency(taxData.income.interest)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium">Dividend Income:</span>
                  <span className="text-sm text-muted-foreground block">
                    {documentBreakdowns.filter(doc => 
                      doc.contributedAmounts?.dividends > 0
                    ).map(doc => doc.fileName).join(', ') || 'Manual entry'}
                  </span>
                </div>
                <span className="font-mono text-lg">{formatCurrency(taxData.income.dividends)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-medium">Other Income:</span>
                  <span className="text-sm text-muted-foreground block">
                    1099-NEC, 1099-MISC, and other sources
                  </span>
                </div>
                <span className="font-mono text-lg">{formatCurrency(taxData.income.other)}</span>
              </div>
            </div>

            {/* Calculation Details */}
            {showCalculationDetails && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Total Income Calculation:</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span>W-2 Wages:</span>
                    <span>+ {formatCurrency(taxData.income.wages)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest (1099-INT):</span>
                    <span>+ {formatCurrency(taxData.income.interest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dividends (1099-DIV):</span>
                    <span>+ {formatCurrency(taxData.income.dividends)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Income:</span>
                    <span>+ {formatCurrency(taxData.income.other)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total Income:</span>
                    <span>= {formatCurrency(totalIncome)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between font-bold text-xl border-t pt-3">
              <span>Total Income:</span>
              <span className="text-green-600">{formatCurrency(totalIncome)}</span>
            </div>
            
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-start space-x-2">
                <div className="text-2xl">💡</div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">
                    Income Auto-Population Status
                  </p>
                  <p className="text-muted-foreground mt-1">
                    This income data has been <strong>automatically extracted</strong> from your {relevantDocs.length} uploaded tax documents
                    using AI-powered document intelligence. You can review and modify any amounts above if needed.
                  </p>
                  {relevantDocs.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Processed documents: </span>
                      <span className="text-xs text-foreground">
                        {relevantDocs.map(doc => 
                          doc.fileName || doc.filename
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
