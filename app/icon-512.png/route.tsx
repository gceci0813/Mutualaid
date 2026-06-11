import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<BrandIcon size={512} />, { width: 512, height: 512 });
}
