import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { width?: number; height?: number; factor?: 2 | 4 };
    const width = body.width ?? 0;
    const height = body.height ?? 0;
    const factor = body.factor ?? 2;

    if (width <= 0 || height <= 0) {
      return NextResponse.json({ success: false, error: "width and height must be positive" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        upscaledWidth: width * factor,
        upscaledHeight: height * factor,
        note: "No-style-change upscaling endpoint placeholder for ESRGAN API.",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}
