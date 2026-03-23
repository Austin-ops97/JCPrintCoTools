import { NextResponse } from "next/server";
import sharp from "sharp";

function getCornerAverage(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const sampleSize = Math.max(8, Math.floor(Math.min(width, height) * 0.08));
  const corners = [
    { x0: 0, y0: 0 },
    { x0: width - sampleSize, y0: 0 },
    { x0: 0, y0: height - sampleSize },
    { x0: width - sampleSize, y0: height - sampleSize },
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const corner of corners) {
    for (let y = corner.y0; y < corner.y0 + sampleSize; y++) {
      for (let x = corner.x0; x < corner.x0 + sampleSize; x++) {
        const i = (y * width + x) * channels;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count += 1;
      }
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const source = sharp(inputBuffer).ensureAlpha();
    const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });

    const bg = getCornerAverage(data, info.width, info.height, info.channels);
    const lowThreshold = 16;
    const highThreshold = 72;

    // Create a softer alpha matte for cleaner cutout edges.
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dr = r - bg.r;
      const dg = g - bg.g;
      const db = b - bg.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      const t = Math.min(1, Math.max(0, (distance - lowThreshold) / (highThreshold - lowThreshold)));
      let alpha = Math.round(255 * smoothstep(t));

      // Reduce white fringing on very bright pixels near the background.
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (distance < highThreshold && saturation < 0.12 && max > 220) {
        alpha = Math.min(alpha, 140);
      }
      data[i + 3] = alpha;
    }

    const output = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .blur(0.35)
      .png()
      .toBuffer();
    const base64 = output.toString("base64");
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${fileName}-transparent.png`,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${base64}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not process image. Try a PNG or JPG file." },
      { status: 400 },
    );
  }
}
