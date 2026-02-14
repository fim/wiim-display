import { NextResponse } from "next/server";
import { getDeviceForRequest, evictClient, stampDeviceCookies } from "@/lib/device";
import { getTransportInfo } from "@/lib/upnp";

export const dynamic = "force-dynamic";

export async function GET() {
  let location: string | undefined;
  try {
    const dev = await getDeviceForRequest();
    location = dev.location;
    const result = await getTransportInfo(dev.client);
    return stampDeviceCookies(NextResponse.json(result), dev);
  } catch (err) {
    console.error("[api/status]", err);
    if (location) evictClient(location);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
