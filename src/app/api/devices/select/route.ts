import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, friendlyName } = body;

    if (!location || !friendlyName) {
      return NextResponse.json(
        { error: "location and friendlyName required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ ok: true, friendlyName });

    // Set cookie — persists across sessions, httpOnly so JS can't tamper
    response.cookies.set("wiim-device", location, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    response.cookies.set("wiim-device-name", friendlyName, {
      path: "/",
      httpOnly: false, // readable by client for display
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    console.log(`[devices/select] Client switched to "${friendlyName}" at ${location}`);
    return response;
  } catch (err) {
    console.error("[api/devices/select]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
