
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/file-storage";
import { DocumentType, ProcessingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "File and document type are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/tiff"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, PNG, JPG, JPEG, and TIFF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate and normalize documentType
    const validDocumentTypes = Object.values(DocumentType);
    const normalizedDocumentType = documentType.toUpperCase().replace(/-/g, '_');
    
    // Check if the provided documentType is valid, otherwise default to OTHER
    const typeToUse = validDocumentTypes.includes(normalizedDocumentType as DocumentType) 
      ? (normalizedDocumentType as DocumentType)
      : DocumentType.OTHER;

    // Upload to local storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudStoragePath = await uploadFile(buffer, file.name, file.type);

    // Save document info to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        cloudStoragePath,
        documentType: typeToUse,
        processingStatus: ProcessingStatus.PENDING,
      }
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      document: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        processingStatus: document.processingStatus,
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
