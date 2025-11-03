
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "./dashboard-header";
import TaxSummary from "./tax-summary";
import DocumentUpload from "./document-upload";
import DocumentList from "./document-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, TrendingUp, CheckCircle2, Clock, Calculator, HelpCircle } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  processingStatus: string;
  uploadedAt: string;
  confidence?: number;
  extractedData: Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: number;
  }>;
}

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

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchTaxCalculation = async () => {
    try {
      const response = await fetch("/api/tax-calculation");
      if (response.ok) {
        const data = await response.json();
        setTaxCalculation(data.taxCalculation);
      }
    } catch (error) {
      console.error("Error fetching tax calculation:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDocuments(), fetchTaxCalculation()]);
      setIsLoading(false);
    };

    if (session) {
      loadData();
    }
  }, [session]);

  const handleDocumentUploaded = () => {
    fetchDocuments();
  };

  const handleCalculateTax = async () => {
    try {
      const response = await fetch("/api/tax-calculation", {
        method: "POST",
      });
      if (response.ok) {
        await fetchTaxCalculation();
      }
    } catch (error) {
      console.error("Error calculating tax:", error);
    }
  };

  const completedDocs = documents?.filter(doc => doc.processingStatus === "COMPLETED")?.length || 0;
  const totalDocs = documents?.length || 0;
  const processingDocs = documents?.filter(doc => doc.processingStatus === "PROCESSING")?.length || 0;

  // Handle session loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tax dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <DashboardHeader />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold mb-3">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-xl text-muted-foreground">
              Tax Return Dashboard
            </p>
          </motion.div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            {
              title: "Documents",
              value: totalDocs,
              icon: <FileText className="h-6 w-6" />,
              gradient: "from-blue-500 to-blue-600",
              tooltip: "Total number of tax documents uploaded to your account. Click to upload more documents like W-2s, 1099s, etc."
            },
            {
              title: "Processed",
              value: completedDocs,
              icon: <CheckCircle2 className="h-6 w-6" />,
              gradient: "from-green-500 to-green-600",
              tooltip: "Documents successfully processed by AI. Data from these forms is automatically extracted and ready for filing."
            },
            {
              title: "Processing",
              value: processingDocs,
              icon: <Clock className="h-6 w-6" />,
              gradient: "from-orange-500 to-orange-600",
              tooltip: "Documents currently being analyzed. Processing typically takes 1-2 minutes per document."
            },
            {
              title: "Tax Liability",
              value: taxCalculation ? `$${Math.round((taxCalculation.estimatedTax || 0) + (taxCalculation.stateTax || 0))}` : "$0",
              icon: <TrendingUp className="h-6 w-6" />,
              gradient: "from-purple-500 to-purple-600",
              tooltip: "Your estimated total tax liability including federal and state taxes. This updates automatically as you add documents."
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm cursor-help">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center mb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <HelpCircle className="w-3 h-3 ml-1 text-muted-foreground/50" />
                          </div>
                          <p className="text-3xl font-bold">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.gradient} text-white`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{stat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </div>

        {/* Tax Filing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-primary to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Ready to file your return?
                  </h2>
                  <p className="text-white/90 text-lg">
                    {completedDocs > 0 
                      ? `${completedDocs} document${completedDocs !== 1 ? 's' : ''} processed • File in minutes`
                      : 'Upload documents or enter manually'
                    }
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/file-return">
                      <Button size="lg" className="bg-white text-primary hover:bg-gray-100 h-14 px-8 text-lg font-semibold">
                        <Calculator className="mr-2 h-5 w-5" />
                        Start Filing
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Launch the guided tax filing wizard that walks you through each step of preparing your tax return</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </motion.div>



        <div className="grid lg:grid-cols-2 gap-8">
          {/* Document Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="h-fit border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="flex items-center gap-3 text-xl cursor-help">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      Upload Documents
                      <HelpCircle className="w-4 h-4 text-muted-foreground/50" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-sm">
                    <p>Supported documents: W-2, 1099-INT, 1099-DIV, 1099-NEC, 1099-MISC, and other tax forms. Our AI extracts all relevant data automatically.</p>
                  </TooltipContent>
                </Tooltip>
                <CardDescription className="text-base">
                  Drop your tax forms for instant data extraction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Tax Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <TaxSummary 
              taxCalculation={taxCalculation}
              onCalculate={handleCalculateTax}
            />
          </motion.div>
        </div>

        {/* Document List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8"
        >
          <DocumentList documents={documents} onRefresh={fetchDocuments} />
        </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
}
