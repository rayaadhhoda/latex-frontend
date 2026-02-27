import { open } from "@tauri-apps/plugin-dialog";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  removeUploadedImage,
  uploadImage,
  type UploadImageData,
} from "@/api/client";

interface ImageForAIChatContextValue {
  uploadedImageData: UploadImageData | null;
  handleAddImage: () => Promise<void>;
  handleRemoveImage: () => Promise<void>;
}

const ImageForAIChatContext = createContext<ImageForAIChatContextValue | null>(null);

interface ImageForAIChatProviderProps {
  children: ReactNode;
}

export function ImageForAIChatProvider({ children }: ImageForAIChatProviderProps) {
  const [uploadedImageData, setUploadedImageData] = useState<UploadImageData | null>(null);

  const handleAddImage = async (): Promise<void> => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"],
        },
      ],
    });

    if (typeof selected === "string") {
      setUploadedImageData(null);
      const uploadResult = await uploadImage(selected);
      const nextUploadedImageData = uploadResult?.data ?? null;
      setUploadedImageData(nextUploadedImageData);
    }
  };

  const handleRemoveImage = async (): Promise<void> => {
    if (!uploadedImageData) return;
    await removeUploadedImage(uploadedImageData.path);
    setUploadedImageData(null);
  };

  const value = useMemo(
    () => ({ uploadedImageData, handleAddImage, handleRemoveImage }),
    [uploadedImageData],
  );

  return <ImageForAIChatContext.Provider value={value}>{children}</ImageForAIChatContext.Provider>;
}

export function useImageForAIChat() {
  const context = useContext(ImageForAIChatContext);
  if (!context) {
    throw new Error("useImageForAIChat must be used within ImageForAIChatProvider");
  }
  return context;
}
