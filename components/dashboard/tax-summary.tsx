
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, DollarSign, TrendingUp, FileText, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";

interface TaxCalculation {
  totalIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
  // State tax information
  stateTax?: number;
  stateWithholdings?: number;
  stateName?: string;
  stateAbbreviation?: string;
}

interface TaxSummaryProps {
  taxCalculation: TaxCalculation | null;
  onCalculate: () => void;
}

export default function TaxSummary({ taxCalculation, onCalculate }: TaxSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate || 0).toFixed(2)}%`;
  };

  return (
    <TooltipProvider>
      <Card className="h-fit border-0 shadow-lg bg-white/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="flex items-center gap-3 text-xl cursor-help">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
                Tax Calculation
                <HelpCircle className="w-4 h-4 text-muted-foreground/50" />
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <p>Real-time tax calculations based on your uploaded documents. Updates automatically as you add more tax forms.</p>
            </TooltipContent>
          </Tooltip>
        <CardDescription className="text-base">
          {taxCalculation 
            ? "Live calculation from your documents" 
            : "Upload documents to see your tax calculation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {taxCalculation ? (
          <>
            {/* Income Summary */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center p-4 bg-blue-50 rounded-lg"
              >
                <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-800">Total Income</p>
                <p className="text-xl font-bold text-blue-900 count-up">
                  {formatCurrency(taxCalculation.totalIncome)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 bg-green-50 rounded-lg"
              >
                <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">Standard Deduction</p>
                <p className="text-xl font-bold text-green-900 count-up">
                  {formatCurrency(taxCalculation.standardDeduction)}
                </p>
              </motion.div>
            </div>

            {/* Tax Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-muted-foreground">Taxable Income:</span>
                <span className="font-medium">{formatCurrency(taxCalculation.taxableIncome)}</span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center py-3 px-4 bg-primary/5 rounded-lg border-l-4 border-primary"
              >
                <span className="font-medium">Federal Tax Owed:</span>
                <span className="text-xl font-bold text-primary count-up">
                  {formatCurrency(taxCalculation.estimatedTax)}
                </span>
              </motion.div>

              {/* State Tax Information - ONLY show if state was extracted from documents */}
              {taxCalculation.stateTax !== undefined && taxCalculation.stateTax > 0 && taxCalculation.stateName && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                >
                  <span className="font-medium">{taxCalculation.stateName} State Tax:</span>
                  <span className="text-xl font-bold text-blue-600 count-up">
                    {formatCurrency(taxCalculation.stateTax)}
                  </span>
                </motion.div>
              )}

              {/* Total Tax (Federal + State) - show calculation used in filing step */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between items-center py-3 px-4 bg-red-50 rounded-lg border-l-4 border-red-500"
              >
                <span className="font-medium">Total Tax Liability:</span>
                <span className="text-xl font-bold text-red-600 count-up">
                  {formatCurrency((taxCalculation.estimatedTax || 0) + (taxCalculation.stateTax || 0))}
                </span>
              </motion.div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center">
                        Effective Rate <HelpCircle className="w-3 h-3 ml-1" />
                      </p>
                      <p className="font-bold text-orange-600">
                        {formatPercentage(taxCalculation.effectiveTaxRate)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average tax rate on your total income (Total Tax ÷ Total Income)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center">
                        Marginal Rate <HelpCircle className="w-3 h-3 ml-1" />
                      </p>
                      <p className="font-bold text-red-600">
                        {formatPercentage(taxCalculation.marginalTaxRate)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tax rate applied to your highest income bracket (next dollar earned)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gray-100 rounded-full">
                <Calculator className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">No Documents Yet</h3>
            <p className="text-gray-600 mb-6">
              Upload your tax documents to see your calculation
            </p>
            <div className="grid grid-cols-2 gap-3">
              {["W-2", "1099-INT", "1099-DIV", "1099-NEC"].map((form) => (
                <div key={form} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                  {form}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <Button
          onClick={onCalculate}
          variant={taxCalculation ? "outline" : "default"}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          {taxCalculation ? "Recalculate" : "Calculate Tax"}
        </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
