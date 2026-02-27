import type { UploadImageData } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./ui/item";

function getImageMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

interface UploadedImageItemProps {
  imageData: UploadImageData;
  onRemove: () => Promise<void>;
}

export default function UploadedImageItem({ imageData, onRemove }: UploadedImageItemProps) {
  return (
    <Item variant="default">
      <ItemMedia variant="image">
        <img
          src={`data:${getImageMimeType(imageData.original_filename)};base64,${imageData.image_bytes}`}
          alt="Uploaded image"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Uploaded image</ItemTitle>
        <ItemDescription>{imageData.original_filename}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          X
        </Button>
      </ItemActions>
    </Item>
  );
}
