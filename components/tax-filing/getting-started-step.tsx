
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calculator, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface GettingStartedStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const getDocumentTypeDisplay = (docType: string) => {
  const types: { [key: string]: { name: string; color: string; icon: string } } = {
    'W2': { name: 'Form W-2 (Wage & Tax Statement)', color: 'bg-blue-500', icon: '💼' },
    'FORM_1099_DIV': { name: 'Form 1099-DIV (Dividends & Distributions)', color: 'bg-green-500', icon: '📈' },
    'FORM_1099_MISC': { name: 'Form 1099-MISC (Miscellaneous Information)', color: 'bg-purple-500', icon: '📋' },
    'FORM_1099_INT': { name: 'Form 1099-INT (Interest Income)', color: 'bg-orange-500', icon: '🏦' },
    'FORM_1099_NEC': { name: 'Form 1099-NEC (Nonemployee Compensation)', color: 'bg-indigo-500', icon: '🔨' },
    'FORM_1040': { name: 'Form 1040 (U.S. Individual Income Tax Return)', color: 'bg-red-500', icon: '📄' },
    'OTHER': { name: 'Other Tax Document', color: 'bg-gray-500', icon: '📎' }
  };
  
  return types[docType] || types['OTHER'];
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 0.9) return { label: 'Excellent', variant: 'default', color: 'text-green-700 bg-green-100' };
  if (confidence >= 0.7) return { label: 'Good', variant: 'secondary', color: 'text-blue-700 bg-blue-100' };
  if (confidence >= 0.5) return { label: 'Fair', variant: 'outline', color: 'text-yellow-700 bg-yellow-100' };
  return { label: 'Needs Review', variant: 'destructive', color: 'text-red-700 bg-red-100' };
};

export default function GettingStartedStep({ documents }: GettingStartedStepProps) {
  const documentsWithData = documents.filter(doc => doc.confidence > 0);
  const totalDocuments = documents.length;
  const averageConfidence = documentsWithData.length > 0 
    ? documentsWithData.reduce((sum, doc) => sum + doc.confidence, 0) / documentsWithData.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          📋
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Tax Filing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional tax preparation powered by Microsoft Azure Document Intelligence. 
            Your uploaded documents will automatically populate your tax return.
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Uploaded:</span>
                <span className="font-semibold text-lg">{totalDocuments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Successfully Processed:</span>
                <span className="font-semibold text-lg text-green-600">{documentsWithData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Confidence:</span>
                <span className="font-semibold text-lg text-blue-600">
                  {Math.round(averageConfidence * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <ShieldCheck className="w-5 h-5 mr-2 text-green-500" />
              Processing Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Azure Document Intelligence
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Field-level extraction
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Confidence scoring
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Auto-population ready
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calculator className="w-5 h-5 mr-2 text-purple-500" />
              Filing Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Personal information verification
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Income from all sources
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                Deductions and credits
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Tax calculation and review
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                Final filing preparation
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Details */}
      {totalDocuments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Processed Tax Documents
              </span>
              {documentsWithData.length > 0 && (
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready for Filing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsWithData.length > 0 ? (
              <div className="space-y-4">
                {documentsWithData.map((doc) => {
                  const docDisplay = getDocumentTypeDisplay(doc.documentType || 'OTHER');
                  const confidenceBadge = getConfidenceBadge(doc.confidence || 0);
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{docDisplay.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{docDisplay.name}</h4>
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            {doc.originalFileName || doc.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={confidenceBadge.color}>
                          {confidenceBadge.label}
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {Math.round((doc.confidence || 0) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Summary Stats */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="font-semibold text-blue-800">Ready to Process</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600">
                        {documentsWithData.length} of {totalDocuments} documents ready
                      </div>
                      <div className="text-xs text-blue-500">
                        Average confidence: {Math.round(averageConfidence * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No Processed Documents</h3>
                  <p className="text-gray-600">
                    Upload your tax documents to get started with automatic data extraction.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Note */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800 mb-1">Professional Tax Preparation</h3>
            <p className="text-green-700 text-sm">
              This system uses Microsoft Azure's enterprise-grade Document Intelligence service to extract 
              data from your tax documents with industry-leading accuracy. All data is processed securely 
              and used solely for preparing your tax return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
