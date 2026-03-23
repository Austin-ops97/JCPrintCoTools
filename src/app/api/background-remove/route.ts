import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { imageName?: string };
    const imageName = body.imageName?.trim();

    if (!imageName) {
      return NextResponse.json({ success: false, error: "imageName is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        file: `${imageName.replace(/\.[^/.]+$/, "")}-transparent.png`,
        note: "Stub endpoint wired for remove.bg / Clipdrop integration.",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}
