import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findFirstDevice } from "./ssdp";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const UpnpDeviceClient = require("upnp-device-client");

export interface DeviceClient {
  callAction(
    serviceId: string,
    actionName: string,
    params: Record<string, unknown>,
    cb: (err: Error | null, result: Record<string, unknown>) => void
  ): void;
}

export interface DeviceResult {
  client: DeviceClient;
  location: string;
  /** Set when auto-discovered (no cookie). Routes must stamp cookies on response. */
  discovered?: { friendlyName: string };
}

/** Cache of UPnP clients keyed by location URL. */
const clientCache = new Map<string, DeviceClient>();

function getClientForLocation(location: string): DeviceClient {
  let client = clientCache.get(location);
  if (!client) {
    client = new UpnpDeviceClient(location) as DeviceClient;
    clientCache.set(location, client);
    console.log(`[device] Created client for ${location}`);
  }
  return client;
}

export function evictClient(location: string): void {
  clientCache.delete(location);
}

/**
 * Read the caller's device cookie and return the matching UPnP client.
 * If no cookie exists, auto-discover using WIIM_DEVICE_NAME.
 */
export async function getDeviceForRequest(): Promise<DeviceResult> {
  const cookieStore = await cookies();
  const location = cookieStore.get("wiim-device")?.value;

  if (location) {
    return { client: getClientForLocation(location), location };
  }

  // No cookie — fall back to SSDP discovery
  const targetName = process.env.WIIM_DEVICE_NAME || undefined;
  console.log(`[device] No cookie — discovering device...`);

  const device = await findFirstDevice(targetName);
  if (!device) {
    throw new Error("No UPnP device found on the network");
  }

  console.log(`[device] Auto-discovered: "${device.friendlyName}" at ${device.location}`);
  return {
    client: getClientForLocation(device.location),
    location: device.location,
    discovered: { friendlyName: device.friendlyName },
  };
}

const COOKIE_OPTS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * If the device was auto-discovered, stamp the cookies onto the response
 * so subsequent requests skip discovery.
 */
export function stampDeviceCookies(
  response: NextResponse,
  dev: DeviceResult
): NextResponse {
  if (dev.discovered) {
    response.cookies.set("wiim-device", dev.location, { ...COOKIE_OPTS, httpOnly: true });
    response.cookies.set("wiim-device-name", dev.discovered.friendlyName, { ...COOKIE_OPTS, httpOnly: false });
  }
  return response;
}
