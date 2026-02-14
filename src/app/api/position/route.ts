import { NextResponse } from "next/server";
import { getDeviceForRequest, evictClient, stampDeviceCookies } from "@/lib/device";
import { getPositionInfo } from "@/lib/upnp";

export const dynamic = "force-dynamic";

export async function GET() {
  let location: string | undefined;
  try {
    const dev = await getDeviceForRequest();
    location = dev.location;
    const result = await getPositionInfo(dev.client);
    return stampDeviceCookies(
      NextResponse.json({
        RelTime: (result.RelTime as string) || "0:00:00",
        TrackDuration: (result.TrackDuration as string) || "0:00:00",
        Track: result.Track || 0,
      }),
      dev
    );
  } catch (err) {
    console.error("[api/position]", err);
    if (location) evictClient(location);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
