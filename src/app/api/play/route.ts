import { NextResponse } from "next/server";
import { getDeviceForRequest, evictClient, stampDeviceCookies } from "@/lib/device";
import { play } from "@/lib/upnp";

export const dynamic = "force-dynamic";

export async function GET() {
  let location: string | undefined;
  try {
    const dev = await getDeviceForRequest();
    location = dev.location;
    await play(dev.client);
    return stampDeviceCookies(NextResponse.json({ ok: true }), dev);
  } catch (err) {
    console.error("[api/play]", err);
    if (location) evictClient(location);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
