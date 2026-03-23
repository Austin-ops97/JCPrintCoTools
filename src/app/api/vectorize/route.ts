import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const colorCount = Math.max(1, Math.min(Number(formData.get("colors")) || 6, 12));
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const imageBase64 = inputBuffer.toString("base64");
    const mimeType = file.type || "image/png";
    const width = Number(formData.get("width")) || 1024;
    const height = Number(formData.get("height")) || 1024;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="mono">
      <feColorMatrix
        type="matrix"
        values="0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0 0 0 1 0"
      />
    </filter>
  </defs>
  <image
    href="data:${mimeType};base64,${imageBase64}"
    width="${width}"
    height="${height}"
    preserveAspectRatio="xMidYMid meet"
    filter="url(#mono)"
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
