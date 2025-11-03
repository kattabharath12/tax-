

// ████████████████████████████████████████████████████████████████████████████████████████
// █ SIMPLE WORKING F1040 PDF DOWNLOAD API - GET IT WORKING FIRST                       █
// █ SENIOR SOFTWARE DEVELOPER: Simple, reliable approach                                █
// █ SENIOR TAX ACCOUNTANT: Focus on accurate data presentation                          █
// ████████████████████████████████████████████████████████████████████████████████████████

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { extractTaxDataFromDocuments, calculateComprehensiveTax } from "@/lib/tax-calculations";
import { generateF1040PDF, mapExtractedDataToF1040, F1040FormData } from "@/lib/f1040-pdf-generator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log('🏛️ SENIOR SOFTWARE DEVELOPER: Starting SIMPLE F1040 PDF generation');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized request');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.id);

    const body = await request.json();
    const { personalInfo } = body;
    console.log('📋 Personal info received:', personalInfo);

    // Get user's completed documents
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      },
      orderBy: { uploadedAt: "desc" }
    });

    console.log(`📊 Found ${documents.length} processed documents`);

    if (documents.length === 0) {
      console.log('❌ No processed documents found');
      return NextResponse.json({
        error: "No processed documents found. Please upload and process your tax documents first."
      }, { status: 400 });
    }

    // **SENIOR SOFTWARE DEVELOPER**: Simple processing
    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    console.log('📊 SENIOR TAX ACCOUNTANT: Extracting tax data...');
    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);

    console.log('🧮 SENIOR TAX ACCOUNTANT: Calculating taxes...');
    const comprehensiveTaxResult = calculateComprehensiveTax(
      extractedTaxData,
      personalInfo?.filingStatus || 'single',
      false, // useItemizedDeductions
      0,     // itemizedDeductionAmount
      0      // estimatedTaxPayments
    );

    console.log('✅ Tax calculations complete');
    console.log(`💰 Total Tax Liability: $${comprehensiveTaxResult.summary.totalTaxLiability.toLocaleString()}`);

    console.log('🗂️ SENIOR TAX ACCOUNTANT: Mapping to F1040 format...');
    const f1040FormData: F1040FormData = mapExtractedDataToF1040(
      extractedTaxData,
      comprehensiveTaxResult,
      documents,
      personalInfo
    );

    console.log('📑 SENIOR SOFTWARE DEVELOPER: Generating simple F1040 PDF...');
    const pdfBuffer = await generateF1040PDF(f1040FormData);

    console.log('✅ PDF generation complete');
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    const fileName = `F1040_${personalInfo?.firstName || 'Taxpayer'}_${personalInfo?.lastName || 'Return'}_2025.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error("❌ SENIOR SOFTWARE DEVELOPER: F1040 PDF generation error:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to generate F1040 PDF. Please try again.";
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : error) : undefined 
      },
      { status: 500 }
    );
  }
}

// Alternative GET endpoint for direct downloads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get basic user info from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const personalInfo = {
      firstName: user.firstName || user.name?.split(' ')[0] || 'Taxpayer',
      lastName: user.lastName || user.name?.split(' ').slice(-1)[0] || '',
      ssn: '', // Would need to be stored securely
      filingStatus: 'single' as const,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      occupation: ''
    };

    // Reuse the POST logic with default personal info
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      },
      orderBy: { uploadedAt: "desc" }
    });

    if (documents.length === 0) {
      return NextResponse.json({
        error: "No processed documents found"
      }, { status: 400 });
    }

    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);
    const comprehensiveTaxResult = calculateComprehensiveTax(extractedTaxData, 'single');
    const f1040FormData = mapExtractedDataToF1040(extractedTaxData, comprehensiveTaxResult, documents, personalInfo);
    const pdfBuffer = await generateF1040PDF(f1040FormData);

    const fileName = `F1040_${personalInfo.firstName}_${personalInfo.lastName}_2025.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("❌ SENIOR SOFTWARE DEVELOPER: F1040 PDF generation error (GET):", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    const errorMessage = error instanceof Error && error.message.includes("No processed documents") 
      ? "No processed tax documents found. Please upload and process your tax documents first."
      : "Failed to generate F1040 PDF. Please try again or contact support if the issue persists.";
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error : undefined },
      { status: 500 }
    );
  }
}

