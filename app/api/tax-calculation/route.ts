
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { extractTaxDataFromDocuments, calculateComprehensiveTax } from "@/lib/tax-calculations";
import { StateTaxCalculator2025 } from "@/lib/state-tax-calculator-2025";

export const dynamic = "force-dynamic";

// Helper function to extract user's state from tax documents - NO STATIC DEFAULTS
function extractUserState(documents: any[]): string | null {
  for (const doc of documents) {
    if (doc.documentType === 'W2' || doc.documentType === 'FORM_W2') {
      // Look for state information in W-2 extracted data
      for (const field of doc.extractedData || []) {
        const fieldName = field.fieldName?.toLowerCase() || '';
        
        // Look for state abbreviation patterns
        if ((fieldName.includes('state') && !fieldName.includes('tax') && !fieldName.includes('withheld')) ||
            fieldName.includes('employerstate') ||
            fieldName.includes('state_id')) {
          const stateValue = field.fieldValue?.trim()?.toUpperCase();
          if (stateValue && stateValue.length === 2) {
            console.log(`🏛️ EXTRACTED STATE: ${stateValue} from W-2 field: ${field.fieldName}`);
            return stateValue;
          }
        }
      }
    }
    
    // Also check 1099 forms for state information
    if (doc.documentType?.includes('1099')) {
      for (const field of doc.extractedData || []) {
        const fieldName = field.fieldName?.toLowerCase() || '';
        
        if (fieldName.includes('state') && !fieldName.includes('tax') && !fieldName.includes('withheld')) {
          const stateValue = field.fieldValue?.trim()?.toUpperCase();
          if (stateValue && stateValue.length === 2) {
            console.log(`🏛️ EXTRACTED STATE: ${stateValue} from ${doc.documentType} field: ${field.fieldName}`);
            return stateValue;
          }
        }
      }
    }
  }
  
  // NO STATIC DEFAULT - return null if no state found in documents
  console.log(`⚠️ No state found in documents - will not calculate state tax`);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🏛️ SENIOR TAX ACCOUNTANT: Starting real data tax calculation');

    // Get all user's completed documents
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      }
    });

    if (documents.length === 0) {
      console.log('📋 No processed documents found for tax calculation');
      return NextResponse.json({
        taxCalculation: null,
        message: "No processed documents found. Please upload and process your tax documents first."
      });
    }

    // Transform documents to expected format
    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    console.log(`📊 Processing ${processedDocs.length} documents for tax calculation`);

    // Extract comprehensive tax data from ALL documents
    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);

    console.log('💰 EXTRACTED TAX DATA SUMMARY:');
    console.log(`  W-2 Wages: $${extractedTaxData.income.wages.toLocaleString()}`);
    console.log(`  Interest: $${extractedTaxData.income.interest.toLocaleString()}`);
    console.log(`  Dividends: $${extractedTaxData.income.dividends.toLocaleString()}`);
    console.log(`  Non-Employee Comp: $${extractedTaxData.income.nonEmployeeCompensation.toLocaleString()}`);
    console.log(`  Federal Tax Withheld: $${extractedTaxData.withholdings.federalTax.toLocaleString()}`);
    console.log(`  State Tax Withheld: $${extractedTaxData.withholdings.stateTax.toLocaleString()}`);

    // Extract user's state from documents (NO STATIC DEFAULTS)
    const userState = extractUserState(processedDocs);

    // Perform comprehensive 11-phase tax calculation
    const comprehensiveTaxResult = calculateComprehensiveTax(
      extractedTaxData,
      'single', // Default filing status - could be user configurable
      false,
      0,
      0
    );

    // Calculate state tax ONLY if state was extracted from documents
    let stateTaxResult: any = null;
    if (userState) {
      try {
        const stateCalculator = new StateTaxCalculator2025();
        stateTaxResult = stateCalculator.calculateStateTax({
          state: userState,
          income: comprehensiveTaxResult.summary.adjustedGrossIncome,
          filingStatus: 'single',
          dependents: 0,
          dividends: extractedTaxData.income.dividends,
          interest: extractedTaxData.income.interest,
          federalAGI: comprehensiveTaxResult.summary.adjustedGrossIncome
        });

        console.log(`🏛️ STATE TAX CALCULATION for ${userState}:`);
        console.log(`  State: ${stateTaxResult.stateName}`);
        console.log(`  State Tax: $${stateTaxResult.stateTax.toLocaleString()}`);
        console.log(`  State Tax Type: ${stateTaxResult.taxType}`);
      } catch (error) {
        console.error(`❌ State tax calculation failed for ${userState}:`, error);
        stateTaxResult = null;
      }
    } else {
      console.log(`⚠️ No state found in documents - skipping state tax calculation`);
    }

    // Convert comprehensive result to legacy format for compatibility
    const legacyTaxCalculation = {
      totalIncome: comprehensiveTaxResult.summary.adjustedGrossIncome,
      standardDeduction: comprehensiveTaxResult.phases.phase4_DeductionDetermination.standardDeduction,
      taxableIncome: comprehensiveTaxResult.summary.taxableIncome,
      estimatedTax: comprehensiveTaxResult.summary.totalTaxLiability,
      effectiveTaxRate: comprehensiveTaxResult.summary.effectiveTaxRate * 100,
      marginalTaxRate: comprehensiveTaxResult.summary.marginalTaxRate * 100,
      // Add state tax information ONLY if state was extracted
      stateTax: stateTaxResult?.stateTax || undefined,
      stateWithholdings: extractedTaxData.withholdings.stateTax || undefined,
      stateName: stateTaxResult?.stateName || undefined,
      stateAbbreviation: userState || undefined
    };

    // Save or update tax return with REAL calculated values
    const taxReturn = await prisma.taxReturn.upsert({
      where: {
        userId_taxYear: {
          userId: session.user.id,
          taxYear: 2025
        }
      },
      update: {
        totalIncome: legacyTaxCalculation.totalIncome,
        standardDeduction: legacyTaxCalculation.standardDeduction,
        taxableIncome: legacyTaxCalculation.taxableIncome,
        estimatedTax: legacyTaxCalculation.estimatedTax,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        taxYear: 2025,
        totalIncome: legacyTaxCalculation.totalIncome,
        standardDeduction: legacyTaxCalculation.standardDeduction,
        taxableIncome: legacyTaxCalculation.taxableIncome,
        estimatedTax: legacyTaxCalculation.estimatedTax,
      }
    });

    console.log('✅ SENIOR TAX ACCOUNTANT: Real tax calculation complete');
    console.log(`📊 Final Tax Liability: $${legacyTaxCalculation.estimatedTax.toLocaleString()}`);

    return NextResponse.json({
      taxCalculation: legacyTaxCalculation,
      taxReturn,
      extractedTaxData, // Include extracted data for transparency
      comprehensiveResult: comprehensiveTaxResult, // Include detailed results
      stateTaxResult, // Include state tax calculation details
      userState // Include detected state
    });
  } catch (error) {
    console.error("❌ Real tax calculation error:", error);
    return NextResponse.json(
      { error: "Tax calculation failed. Please ensure you have uploaded and processed your tax documents." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔍 SENIOR DEVELOPER: Fetching real tax calculation data');

    // Get all user's completed documents for real-time calculation
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      }
    });

    if (documents.length === 0) {
      console.log('📋 No processed documents found');
      return NextResponse.json({ 
        taxCalculation: null,
        message: "No processed documents found. Upload documents to see tax calculation."
      });
    }

    // Always calculate from real extracted data, never use cached mock values
    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);
    const comprehensiveTaxResult = calculateComprehensiveTax(extractedTaxData, 'single');

    // Extract user's state and calculate state tax ONLY if state is found in documents
    const userState = extractUserState(processedDocs);
    let stateTaxResult: any = null;
    
    if (userState) {
      try {
        const stateCalculator = new StateTaxCalculator2025();
        stateTaxResult = stateCalculator.calculateStateTax({
          state: userState,
          income: comprehensiveTaxResult.summary.adjustedGrossIncome,
          filingStatus: 'single',
          dependents: 0,
          dividends: extractedTaxData.income.dividends,
          interest: extractedTaxData.income.interest,
          federalAGI: comprehensiveTaxResult.summary.adjustedGrossIncome
        });
      } catch (error) {
        console.error(`❌ GET: State tax calculation failed for ${userState}:`, error);
        stateTaxResult = null;
      }
    } else {
      console.log(`⚠️ GET: No state found in documents - skipping state tax calculation`);
    }

    const realTaxCalculation = {
      totalIncome: comprehensiveTaxResult.summary.adjustedGrossIncome,
      standardDeduction: comprehensiveTaxResult.phases.phase4_DeductionDetermination.standardDeduction,
      taxableIncome: comprehensiveTaxResult.summary.taxableIncome,
      estimatedTax: comprehensiveTaxResult.summary.totalTaxLiability,
      effectiveTaxRate: comprehensiveTaxResult.summary.effectiveTaxRate * 100,
      marginalTaxRate: comprehensiveTaxResult.summary.marginalTaxRate * 100,
      // Add state tax information ONLY if state was extracted
      stateTax: stateTaxResult?.stateTax || undefined,
      stateWithholdings: extractedTaxData.withholdings.stateTax || undefined,
      stateName: stateTaxResult?.stateName || undefined,
      stateAbbreviation: userState || undefined
    };

    console.log('✅ SENIOR DEVELOPER: Real-time calculation complete');

    return NextResponse.json({
      taxCalculation: realTaxCalculation,
      extractedTaxData,
      comprehensiveResult: comprehensiveTaxResult,
      stateTaxResult, // Include state tax calculation details
      userState, // Include detected state
      message: "Tax calculation based on real extracted data"
    });
  } catch (error) {
    console.error("❌ Get real tax calculation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax calculation" },
      { status: 500 }
    );
  }
}
