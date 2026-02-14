import { Client as SSDPClient } from "node-ssdp";
import { XMLParser } from "fast-xml-parser";
import type { WiiMDevice } from "./types";

/**
 * Discover UPnP location URLs on the local network via SSDP M-SEARCH.
 */
function findUPnPLocations(): Promise<string[]> {
  return new Promise((resolve) => {
    const locations = new Set<string>();
    const client = new SSDPClient();

    client.on("response", (headers) => {
      const loc = headers.LOCATION || headers.location || headers.Location;
      if (loc) locations.add(String(loc));
    });

    client.search("ssdp:all");

    // Wait for responses then stop
    setTimeout(() => {
      client.stop();
      resolve(Array.from(locations));
    }, 3000);
  });
}

/**
 * Resolve all UPnP locations to devices with friendly names.
 */
async function resolveDevices(locations: string[]): Promise<WiiMDevice[]> {
  const parser = new XMLParser({ ignoreAttributes: false });
  const devices: WiiMDevice[] = [];

  for (const location of locations) {
    try {
      const resp = await fetch(location, { signal: AbortSignal.timeout(2000) });
      const text = await resp.text();
      const parsed = parser.parse(text);

      const device = parsed?.root?.device;
      if (!device) continue;

      const friendlyName: string = device.friendlyName || "";
      if (friendlyName) {
        console.log(`[ssdp] Device: "${friendlyName}" at ${location}`);
        devices.push({ location, friendlyName });
      }
    } catch {
      // skip unreachable devices
    }
  }

  return devices;
}

/**
 * Discover all UPnP devices on the network.
 */
export async function findAllDevices(): Promise<WiiMDevice[]> {
  const locations = await findUPnPLocations();
  console.log(`[ssdp] Found ${locations.length} UPnP locations`);
  return resolveDevices(locations);
}

/**
 * Find the first available device, optionally filtering by name.
 */
export async function findFirstDevice(targetName?: string): Promise<WiiMDevice | null> {
  const devices = await findAllDevices();
  if (devices.length === 0) return null;

  if (targetName) {
    const match = devices.find(d =>
      d.friendlyName.toLowerCase().includes(targetName.toLowerCase())
    );
    if (match) return match;
  }

  // Default to the first device found
  return devices[0];
}
