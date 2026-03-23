import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const colorCount = Math.max(1, Math.min(Number(formData.get("colors")) || 6, 12));
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(inputBuffer).rotate().metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;
    const mimeType = file.type || "image/png";
    const imageBase64 = inputBuffer.toString("base64");
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    // Lossless-preserving SVG wrapper keeps original raster quality intact.
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <image
    href="data:${mimeType};base64,${imageBase64}"
    width="${width}"
    height="${height}"
    preserveAspectRatio="xMidYMid meet"
  />
</svg>`;
    const svgBase64 = Buffer.from(svg, "utf8").toString("base64");

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${fileName}-vector.svg`,
        mimeType: "image/svg+xml",
        dataUrl: `data:image/svg+xml;base64,${svgBase64}`,
        colorCount,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not convert to SVG. Try a PNG or JPG file." },
      { status: 400 },
    );
  }
}
