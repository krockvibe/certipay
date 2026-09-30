import { useState, useCallback } from "react";

export function useImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const clear = useCallback(() => {
    setPreview(null);
    setFile(null);
  }, []);

  const upload = useCallback(async (): Promise<string> => {
    if (!file) return "";
    setIsUploading(true);
    // In a real app, this would upload to a server/CDN
    // For now, we'll use the data URL directly
    const result = preview;
    setIsUploading(false);
    return result || "";
  }, [file, preview]);

  return {
    preview,
    file,
    isUploading,
    handleFileChange,
    clear,
    upload,
  };
}

export function useMultipleImageUploads() {
  const logo = useImageUpload();
  const bankLogo = useImageUpload();
  const receiptImage = useImageUpload();

  const uploadAll = useCallback(async () => {
    const [logoUrl, bankLogoUrl, receiptImageUrl] = await Promise.all([
      logo.upload(),
      bankLogo.upload(),
      receiptImage.upload(),
    ]);
    return { logoUrl, bankLogoUrl, receiptImageUrl };
  }, [logo, bankLogo, receiptImage]);

  const clearAll = useCallback(() => {
    logo.clear();
    bankLogo.clear();
    receiptImage.clear();
  }, [logo, bankLogo, receiptImage]);

  return {
    logo,
    bankLogo,
    receiptImage,
    uploadAll,
    clearAll,
  };
}