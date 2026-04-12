import { open } from "@tauri-apps/plugin-dialog";
import type { FileUIPart } from "ai";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  removeUploadedImage,
  uploadImage,
  uploadImageData,
  type UploadImageData,
} from "@/api/client";

function fileUIPartToUploadPayload(part: FileUIPart): {
  image_base64: string;
  media_type: string;
  original_filename: string;
} | null {
  const url = part.url;
  if (!url) {
    return null;
  }
  if (!url.startsWith("data:")) {
    return null;
  }
  const comma = url.indexOf(",");
  if (comma === -1) {
    return null;
  }
  const header = url.slice(0, comma);
  const data = url.slice(comma + 1);
  const filename = part.filename ?? "image.png";
  const mediaType = part.mediaType ?? "application/octet-stream";
  if (header.includes(";base64")) {
    return {
      image_base64: data,
      media_type: mediaType,
      original_filename: filename,
    };
  }
  try {
    return {
      image_base64: btoa(data),
      media_type: mediaType,
      original_filename: filename,
    };
  } catch {
    return null;
  }
}

interface ImageForAIChatContextValue {
  uploadedImageData: UploadImageData | null;
  handleAddImage: () => Promise<void>;
  handleRemoveImage: () => Promise<void>;
  /** Returns the attachment path used for this send (if any). */
  syncImageFromPromptFiles: (files: FileUIPart[]) => Promise<string | null>;
  /** Clears UI/state after a message; defers file delete so tools can read the image. */
  clearAttachmentAfterSend: (path: string) => void;
}

const ImageForAIChatContext = createContext<ImageForAIChatContextValue | null>(null);

interface ImageForAIChatProviderProps {
  children: ReactNode;
}

export function ImageForAIChatProvider({ children }: ImageForAIChatProviderProps) {
  const [uploadedImageData, setUploadedImageData] = useState<UploadImageData | null>(null);

  const handleAddImage = useCallback(async (): Promise<void> => {
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
      const previous = uploadedImageData;
      setUploadedImageData(null);
      if (previous) {
        await removeUploadedImage(previous.path);
      }
      const uploadResult = await uploadImage(selected);
      const nextUploadedImageData = uploadResult?.data ?? null;
      setUploadedImageData(nextUploadedImageData);
    }
  }, [uploadedImageData]);

  const handleRemoveImage = useCallback(async (): Promise<void> => {
    if (!uploadedImageData) return;
    const path = uploadedImageData.path;
    setUploadedImageData(null);
    await removeUploadedImage(path);
  }, [uploadedImageData]);

  const syncImageFromPromptFiles = useCallback(
    async (files: FileUIPart[]): Promise<string | null> => {
      if (files.length === 0) {
        return uploadedImageData?.path ?? null;
      }
      const payload = fileUIPartToUploadPayload(files[0]);
      if (!payload) {
        return null;
      }
      const res = await uploadImageData(payload);
      const next = res?.data ?? null;
      if (!next) {
        return null;
      }
      const previousPath = uploadedImageData?.path;
      setUploadedImageData(next);
      if (previousPath && previousPath !== next.path) {
        await removeUploadedImage(previousPath);
      }
      return next.path;
    },
    [uploadedImageData],
  );

  const clearAttachmentAfterSend = useCallback((path: string) => {
    setUploadedImageData((prev) => {
      if (prev?.path !== path) {
        return prev;
      }
      window.setTimeout(() => {
        void removeUploadedImage(path);
      }, 15_000);
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({
      clearAttachmentAfterSend,
      handleAddImage,
      handleRemoveImage,
      syncImageFromPromptFiles,
      uploadedImageData,
    }),
    [
      uploadedImageData,
      syncImageFromPromptFiles,
      clearAttachmentAfterSend,
      handleAddImage,
      handleRemoveImage,
    ],
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
