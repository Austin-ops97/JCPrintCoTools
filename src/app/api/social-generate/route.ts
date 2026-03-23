import { NextResponse } from "next/server";

const tags = ["#ScreenPrinting", "#CustomShirts", "#SmallBusiness", "#LocalBrand"]; 

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { theme?: string; audience?: string };
    const theme = body.theme?.trim() || "new drop";
    const audience = body.audience?.trim() || "local businesses";

    return NextResponse.json({
      success: true,
      data: {
        caption: `Fresh ${theme} designs are live. Built for ${audience} who want print quality that lasts. DM us for bulk pricing and same-week turnaround.`,
        hashtags: tags,
        cta: "Message us to get your first proof today.",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }
}
