import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url param" }, { status: 400 });
  }

  try {
    const imageBuffer = await new Promise<{
      data: Buffer;
      contentType: string;
    }>((resolve, reject) => {
      const getter = url.startsWith("https") ? https : http;
      const options = url.startsWith("https")
        ? { rejectUnauthorized: false }
        : {};

      getter.get(url, options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            data: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "image/jpeg",
          });
        });
        res.on("error", reject);
      }).on("error", reject);
    });

    return new NextResponse(new Uint8Array(imageBuffer.data), {
      headers: {
        "Content-Type": imageBuffer.contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "failed to fetch image" }, { status: 502 });
  }
}
