import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const factorValue = Number(formData.get("factor"));
    const factor = factorValue === 4 ? 4 : 2;
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input);
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width <= 0 || height <= 0) {
      return NextResponse.json({ success: false, error: "Unsupported image dimensions." }, { status: 400 });
    }

    const output = await image
      .resize(width * factor, height * factor, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
    const base64 = output.toString("base64");
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${fileName}-${factor}x.png`,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${base64}`,
        upscaledWidth: width * factor,
        upscaledHeight: height * factor,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not upscale image. Try a PNG or JPG file." },
      { status: 400 },
    );
  }
}
