import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findAllDevices } from "@/lib/ssdp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const devices = await findAllDevices();
    const cookieStore = await cookies();
    const activeLocation = cookieStore.get("wiim-device")?.value || null;
    return NextResponse.json({ devices, activeLocation });
  } catch (err) {
    console.error("[api/devices]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
