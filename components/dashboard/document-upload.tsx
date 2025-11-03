
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";

interface DocumentUploadProps {
  onDocumentUploaded: () => void;
}

export default function DocumentUpload({ onDocumentUploaded }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus('idle');
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    setIsUploading(true);
    setUploadStatus('idle');
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setSelectedFile(null);
        setDocumentType("");
        onDocumentUploaded();
        
        // Start processing the document
        if (data.document?.id) {
          fetch("/api/process-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: data.document.id }),
          }).then(() => {
            // Refresh documents after processing
            setTimeout(() => onDocumentUploaded(), 2000);
          });
        }
      } else {
        setUploadStatus('error');
        setErrorMessage(data.error || "Upload failed");
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage("");
  };

  const documentTypes = [
    { value: "W2", label: "W-2" },
    { value: "FORM_1099_DIV", label: "1099-DIV" },
    { value: "FORM_1099_MISC", label: "1099-MISC" },
    { value: "FORM_1099_INT", label: "1099-INT" },
    { value: "FORM_1099_NEC", label: "1099-NEC" },
    { value: "FORM_1040", label: "1040" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-gray-300 hover:border-primary/60 hover:bg-primary/5'
          }
        `}
      >
        <input {...getInputProps()} />
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Upload className={`h-16 w-16 mx-auto mb-6 transition-colors ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          <h3 className="text-xl font-bold mb-3">
            {isDragActive ? "Drop it here!" : "Upload Your Tax Documents"}
          </h3>
          <p className="text-gray-600 mb-2 text-lg">
            <span className="font-semibold text-primary">Click to browse</span> or drag & drop
          </p>
          <p className="text-sm text-gray-500">
            PDF, PNG, JPG, TIFF • Up to 10MB
          </p>
        </motion.div>
      </div>

      {/* Selected File */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
                className="hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Type Selection */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="text-sm font-semibold text-gray-700">Document Type</label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-primary">
              <SelectValue placeholder="Choose your tax document type..." />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Upload Button */}
      {selectedFile && documentType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-green-600 hover:opacity-90"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing Document...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-3" />
                Upload & Process
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Status Messages */}
      <AnimatePresence>
        {uploadStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-3 text-green-700 bg-green-100 p-4 rounded-xl border border-green-200"
          >
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-semibold">Success! Document uploaded and processing...</span>
          </motion.div>
        )}
        
        {uploadStatus === 'error' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-3 text-red-700 bg-red-100 p-4 rounded-xl border border-red-200"
          >
            <X className="h-6 w-6" />
            <span className="font-semibold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
