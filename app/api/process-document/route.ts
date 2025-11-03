import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/file-storage";
import { getAzureClient } from "@/lib/azure-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: "PROCESSING" }
    });

    try {
      // Read file from local storage
      const fileBuffer = await getFile(document.cloudStoragePath);

      // Get Azure client instance
      const azureClient = getAzureClient();

      // Process with Azure Document Intelligence using filename for better model selection
      const result = await azureClient.analyzeDocument(
        fileBuffer, 
        document.documentType, 
        document.fileName || 'document.pdf'
      );
      const extractedFields = azureClient.extractFieldsFromResult(result);
      
      console.log(`🎯 Processing results for ${document.fileName}:`);
      console.log(`- Model used: ${result.modelUsed}`);
      console.log(`- Documents found: ${result.documents?.length || 0}`);
      console.log(`- Total fields extracted: ${extractedFields.length}`);

      // Save extracted data to database
      const extractedDataPromises = extractedFields.map(field =>
        prisma.extractedData.create({
          data: {
            documentId: document.id,
            fieldName: field.fieldName,
            fieldValue: field.fieldValue,
            confidence: field.confidence,
          }
        })
      );

      await Promise.all(extractedDataPromises);

      // Calculate overall confidence from documents
      const overallConfidence = result.documents.length > 0 
        ? result.documents.reduce((sum, doc) => sum + doc.confidence, 0) / result.documents.length 
        : 0;
      
      console.log(`📊 Overall document confidence: ${Math.round(overallConfidence * 100)}%`);

      // Update document status to completed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: "COMPLETED",
          processedAt: new Date(),
          confidence: overallConfidence
        }
      });

      return NextResponse.json({
        message: "Document processed successfully",
        extractedFields: extractedFields
      });

    } catch (processingError) {
      console.error("Processing error:", processingError);
      
      // Update document status to failed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: "FAILED",
          errorMessage: processingError instanceof Error ? processingError.message : "Processing failed"
        }
      });

      return NextResponse.json(
        { error: "Document processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Process document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
