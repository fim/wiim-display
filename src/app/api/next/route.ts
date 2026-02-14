import { NextResponse } from "next/server";
import { getDeviceForRequest, evictClient, stampDeviceCookies } from "@/lib/device";
import { next } from "@/lib/upnp";

export const dynamic = "force-dynamic";

export async function GET() {
  let location: string | undefined;
  try {
    const dev = await getDeviceForRequest();
    location = dev.location;
    await next(dev.client);
    return stampDeviceCookies(NextResponse.json({ ok: true }), dev);
  } catch (err) {
    console.error("[api/next]", err);
    if (location) evictClient(location);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
