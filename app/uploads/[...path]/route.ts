import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getType } from "mime"; // You might need to install 'mime' or use a simple map. Since I can't easily install deps, I'll use a simple map effectively.

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params;

    // Security: Prevent directory traversal
    const safePath = pathSegments.join('/').replace(/(\.\.(\/|\\|$))+/g, '');

    const filePath = path.join(process.cwd(), 'public', 'uploads', safePath);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("File not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const fileStream = fs.createReadStream(filePath);

    // Simple mime type logic or default to octet-stream
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';

    const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ipa': 'application/octet-stream', // iOS App
        '.apk': 'application/vnd.android.package-archive', // Android App
        '.plist': 'text/xml',
    };

    if (mimeMap[ext]) {
        contentType = mimeMap[ext];
    }

    return new NextResponse(fileStream as any, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileSize.toString(),
            // Cache control for performance
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
