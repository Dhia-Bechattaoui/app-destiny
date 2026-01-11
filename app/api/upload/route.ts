
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { applications, versions } from "@/lib/db/schema";
import { parseAppFile } from "@/lib/parser";
import { unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import fs from "fs";
import { cookies } from "next/headers";
import { Readable } from 'stream';
import { eq, and } from "drizzle-orm";

// Helper to convert web ReadableStream to node Readable
function webToNodeStream(webStream: ReadableStream<Uint8Array>) {
    const reader = webStream.getReader();
    return new Readable({
        async read() {
            const { done, value } = await reader.read();
            if (done) {
                this.push(null);
            } else {
                this.push(Buffer.from(value));
            }
        },
    });
}

export async function POST(request: Request) {
    const rawFileName = request.headers.get('X-File-Name') || `upload-${Date.now()}`;
    const fileName = decodeURIComponent(rawFileName);
    const tempPath = join(tmpdir(), `${randomUUID()}-${fileName}`);
    let iconUrl = "";

    try {
        // 1. Auth Check (Dual Mode)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let isValidLocal = false;

        if (!user) {
            // Check for Local Token
            const cookieStore = await cookies();
            const token = cookieStore.get('sb-access-token')?.value;

            if (token) {
                const { verifyToken } = await import("@/lib/auth/token");
                const payload = await verifyToken(token);
                if (payload) isValidLocal = true;
            }
        }

        if (!user && !isValidLocal) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Stream Request to Temp File
        if (!request.body) {
            return NextResponse.json({ error: "No body provided" }, { status: 400 });
        }

        const nodeStream = webToNodeStream(request.body as any);
        const writeStream = fs.createWriteStream(tempPath);

        await new Promise((resolve, reject) => {
            nodeStream.pipe(writeStream);
            writeStream.on('finish', () => resolve(null));
            writeStream.on('error', reject);
        });

        console.log("File saved to:", tempPath);

        // 3. Parse Metadata
        const metadata = await parseAppFile(tempPath);
        console.log("Metadata parsed:", metadata);

        // Check for Duplicates in VERSIONS table
        // We first need to see if the app exists to know its ID, but for duplicate check we can just join or search logic.
        // Actually simplest is: Check if bundleId exists in applications, if so, get ID, then check versions.

        let appId: number;
        const existingApps = await db.select().from(applications).where(
            and(
                eq(applications.bundleId, metadata.bundleId),
                eq(applications.os, metadata.os)
            )
        ).limit(1);

        if (existingApps.length > 0) {
            appId = existingApps[0].id;
            // Check for duplicate version/build
            const existingVersion = await db.select().from(versions).where(
                and(
                    eq(versions.appId, appId),
                    eq(versions.buildNumber, metadata.buildNumber)
                )
            ).limit(1);

            if (existingVersion.length > 0) {
                throw new Error(`Build Number ${metadata.buildNumber} already exists for this app. Please increment the version code.`);
            }
        } else {
            // New App
            const [newApp] = await db.insert(applications).values({
                name: metadata.name,
                bundleId: metadata.bundleId,
                os: metadata.os,
                iconUrl: iconUrl || null,
                description: "Uploaded via Dashboard",
            }).returning();
            appId = newApp.id;
        }

        // 4. Upload Logic (Supabase vs Local)
        // ... (Logic continues below, but we need to insert VERSION later)
        const fileExt = fileName.split('.').pop();
        const relativeStoragePath = `${metadata.os}/${metadata.bundleId}/${metadata.version}-${metadata.buildNumber}.${fileExt}`;
        let publicUrl = "";

        // ... (Re-using existing upload logic variables)

        const isSupabaseConfigured = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
        const storageModeEnv = (process.env.STORAGE_MODE || '').trim().toLowerCase();
        const useLocalStorage = storageModeEnv === 'local' || !isSupabaseConfigured;

        console.log(`[Upload] STORAGE_MODE env: "${process.env.STORAGE_MODE}"`);
        console.log(`[Upload] Resolved Mode: ${useLocalStorage ? 'LOCAL' : 'SUPABASE'}`);

        // Handle Icon Upload if present (Logic is mostly same but we need to ensure iconUrl is set if not already)
        if (metadata.icon) {
            const iconFilename = `icon-${metadata.version}-${metadata.buildNumber}.png`;
            const iconStoragePath = `${metadata.os}/${metadata.bundleId}/${iconFilename}`;

            if (isSupabaseConfigured && !useLocalStorage) {
                try {
                    const { data, error } = await supabase.storage.from('apps').upload(iconStoragePath, metadata.icon, {
                        contentType: 'image/png',
                        upsert: true
                    });
                    if (error) throw error;
                    const { data: publicUrlData } = supabase.storage.from('apps').getPublicUrl(iconStoragePath);
                    iconUrl = publicUrlData.publicUrl;
                } catch (e) {
                    console.error("[Upload] Supabase Icon Upload Error, falling back to local:", e);
                    const publicDir = join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(publicDir)) {
                        fs.mkdirSync(publicDir, { recursive: true });
                    }
                    const localIconPath = join(publicDir, `${metadata.bundleId}-${iconFilename}`);
                    await fs.promises.writeFile(localIconPath, metadata.icon);
                    iconUrl = `/uploads/${metadata.bundleId}-${iconFilename}`;
                }
            } else {
                const publicDir = join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                }
                const localIconPath = join(publicDir, `${metadata.bundleId}-${iconFilename}`);
                await fs.promises.writeFile(localIconPath, metadata.icon);
                iconUrl = `/uploads/${metadata.bundleId}-${iconFilename}`;
            }

            // Should upgrade app icon if it's new
            await db.update(applications).set({ iconUrl: iconUrl, updatedAt: new Date() }).where(eq(applications.id, appId));
        }

        if (!useLocalStorage && isSupabaseConfigured) {
            // Check if we can actually reach Supabase Storage buckets
            let uploadSuccess = false;
            try {
                // Upload to Supabase
                const fileStream = fs.createReadStream(tempPath);
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('apps')
                    .upload(relativeStoragePath, fileStream as any, {
                        contentType: request.headers.get('Content-Type') || 'application/octet-stream',
                        duplex: 'half',
                        upsert: true
                    });

                if (uploadError) {
                    console.error("Supabase Upload Error:", uploadError);
                    // If it's a fetch failure (network), throw to trigger catch, OR fallback to local inside here?
                    // Currently throws, but let's allow fallback if it's a connection issue.
                    throw new Error(`Supabase Error: ${uploadError.message}`);
                }

                const { data } = supabase.storage.from('apps').getPublicUrl(relativeStoragePath);
                publicUrl = data.publicUrl;
                uploadSuccess = true;
            } catch (err: any) {
                console.error("[Upload] Supabase attempt failed, falling back to local storage.", err);
                // Fallback logic
                const publicDir = join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                }

                const localFileName = `${metadata.bundleId}-${metadata.version}-${metadata.buildNumber}.${fileExt}`;
                const localFilePath = join(publicDir, localFileName);
                await fs.promises.copyFile(tempPath, localFilePath);
                publicUrl = `/uploads/${localFileName}`;
                console.log("Saved locally to (fallback):", localFilePath);
            }

        } else {
            // Local Fallback
            const publicDir = join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            const localFileName = `${metadata.bundleId}-${metadata.version}-${metadata.buildNumber}.${fileExt}`;
            const localFilePath = join(publicDir, localFileName);

            await fs.promises.copyFile(tempPath, localFilePath);
            publicUrl = `/uploads/${localFileName}`;
            console.log("Saved locally to:", localFilePath);
        }

        // 5. Insert to DB (Versions)
        const stats = await fs.promises.stat(tempPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";

        await db.insert(versions).values({
            appId: appId,
            version: metadata.version,
            buildNumber: metadata.buildNumber,
            fileUrl: publicUrl,
            size: fileSizeInMB,
        });

        // Update App timestamp
        await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, appId));

        return NextResponse.json({ success: true, metadata });

    } catch (error: any) {
        if (error.message.includes("already exists")) {
            console.log(`[Upload] Rejected duplicate: ${error.message}`);
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("Upload Route Error:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    } finally {
        // Cleanup temp file
        if (fs.existsSync(tempPath)) {
            try {
                await unlink(tempPath);
            } catch (e) { /* ignore */ }
        }
    }
}
