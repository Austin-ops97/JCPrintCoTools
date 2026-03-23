import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const output = await sharp(input).rotate().grayscale().png().toBuffer();
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${fileName}-grayscale.png`,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${output.toString("base64")}`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not create grayscale output. Try PNG or JPG." },
      { status: 400 },
    );
  }
}
