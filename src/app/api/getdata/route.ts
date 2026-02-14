import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { getDeviceForRequest, evictClient, stampDeviceCookies } from "@/lib/device";
import { getMediaInfo } from "@/lib/upnp";

export const dynamic = "force-dynamic";

export async function GET() {
  let location: string | undefined;
  try {
    const dev = await getDeviceForRequest();
    location = dev.location;
    const result = await getMediaInfo(dev.client);

    let meta = (result.CurrentURIMetaData as string) || "";
    meta = meta.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g, "&amp;");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(meta);
    const item = parsed?.["DIDL-Lite"]?.item || {};

    if (result.TrackSource) {
      item.TrackSource = result.TrackSource;
    }

    return stampDeviceCookies(NextResponse.json(item), dev);
  } catch (err) {
    console.error("[api/getdata]", err);
    if (location) evictClient(location);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
