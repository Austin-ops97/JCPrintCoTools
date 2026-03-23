import { NextResponse } from "next/server";
import sharp from "sharp";

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

    // Remove near-white background while preserving foreground.
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = (r + g + b) / 3;
      const isNearWhite = r > 235 && g > 235 && b > 235;
      if (isNearWhite) {
        data[i + 3] = 0;
      } else if (avg > 210) {
        data[i + 3] = Math.min(data[i + 3], 170);
      }
    }

    const output = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
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
