import spartanLogo from "@/assets/spartan-logo.png";

interface BrandLogoProps {
  size?: "md" | "lg";
  sjsuColors?: boolean;
}

export default function BrandLogo({ size = "md", sjsuColors = false }: BrandLogoProps) {
  const isLarge = size === "lg";
  return (
    <div className={`flex items-center ${isLarge ? "gap-4" : "gap-2"}`}>
      <img
        src={spartanLogo}
        alt=""
        width={276}
        height={295}
        className={`object-contain shrink-0 ${
          isLarge ? "h-16 w-16" : "h-7 w-7"
        }`}
        decoding="async"
      />
      <span
        className={`font-bold ${isLarge ? "text-4xl" : "text-lg"}`}
      >
        {sjsuColors ? (
          <>
            <span className="text-[#E5A823]">Spartan</span> <span className="text-white">Write</span>
          </>
        ) : (
          "Spartan Write"
        )}
      </span>
    </div>
  );
}
