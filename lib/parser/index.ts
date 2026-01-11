
import AppInfoParser from 'app-info-parser';
import StreamZip from 'node-stream-zip';
import path from 'path';

export type AppMetadata = {
    name: string;
    os: 'android' | 'ios';
    version: string;
    buildNumber: string;
    bundleId: string;
    icon?: Buffer;
};

function isValidImage(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    // JPG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    // WebP (RIFF....WEBP)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        // Double check WEBP at offset 8
        if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
        return true; // Accept generic RIFF for now
    }
    return false;
}

async function findIconInZip(filePath: string): Promise<Buffer | undefined> {
    let iconBuffer: Buffer | undefined;
    const zip = new StreamZip.async({ file: filePath });
    const ext = path.extname(filePath).toLowerCase();

    try {
        const entries = await zip.entries();

        if (ext === '.apk') {
            // Strategy 1: Deterministic search for standard mipmap icons (Best Quality)
            const searchPaths = [
                /res\/mipmap-xxxhdpi.*\/ic_launcher\.png$/,
                /res\/mipmap-xxhdpi.*\/ic_launcher\.png$/,
                /res\/mipmap-xhdpi.*\/ic_launcher\.png$/,
                /res\/mipmap-hdpi.*\/ic_launcher\.png$/,
                /res\/mipmap-mdpi.*\/ic_launcher\.png$/,
                /res\/mipmap-xxxhdpi.*\/ic_launcher_round\.png$/
            ];

            for (const pattern of searchPaths) {
                const match = Object.values(entries).find(e => pattern.test(e.name));
                if (match) {
                    console.log(`[Parser] Fallback: Found exact match for pattern ${pattern}: ${match.name}`);
                    iconBuffer = await zip.entryData(match);
                    break;
                }
            }

            // Strategy 2: Obfuscation Fallback (Heuristic) for APK
            if (!iconBuffer) {
                console.warn("[Parser] Standard icon not found. Attempting heuristic search for obfuscated resources...");
                const candidateEntries = Object.values(entries).filter(e => {
                    const name = e.name.toLowerCase();
                    if (!name.startsWith('res/')) return false;
                    if (!name.endsWith('.png') && !name.endsWith('.webp') && !name.endsWith('.jpg')) return false;
                    if (name.endsWith('.9.png')) return false; // Exclude 9-patch
                    if (name.endsWith('.xml')) return false;
                    return true;
                });
                candidateEntries.sort((a, b) => b.size - a.size);
                if (candidateEntries.length > 0) {
                    const bestCandidate = candidateEntries[0];
                    console.log(`[Parser] Heuristic: Found largest resource image: ${bestCandidate.name} (${bestCandidate.size} bytes)`);
                    iconBuffer = await zip.entryData(bestCandidate);
                }
            }

        } else if (ext === '.ipa') {
            // Strategy 1: iTunesArtwork (High res, often at root)
            // iTunesArtwork is a JPEG or PNG but often has no extension
            const artworkEntry = Object.values(entries).find(e =>
                e.name.toLowerCase() === 'itunesartwork' ||
                e.name.toLowerCase() === 'itunesartwork@2x'
            );

            if (artworkEntry) {
                console.log(`[Parser] Found iTunesArtwork: ${artworkEntry.name}`);
                iconBuffer = await zip.entryData(artworkEntry);
            }

            // Strategy 2: AppIcon in Payload
            if (!iconBuffer) {
                // Look for largest AppIcon*.png in Payload/*.app/
                const candidateEntries = Object.values(entries).filter(e => {
                    const name = e.name; // Keep case for regex potentially, but generally case insensitive search matches
                    // Must be in Payload/Something.app/
                    if (!/^Payload\/[^/]+\.app\//.test(name)) return false;

                    // Allow AppIcon*.png or just huge PNGs
                    // Apple uses AppIcon60x60@3x.png etc. 
                    return name.includes('AppIcon') && name.endsWith('.png');
                });

                // Sort by size DESC
                candidateEntries.sort((a, b) => b.size - a.size);

                if (candidateEntries.length > 0) {
                    const bestCandidate = candidateEntries[0];
                    console.log(`[Parser] Found AppIcon in Payload: ${bestCandidate.name}`);
                    iconBuffer = await zip.entryData(bestCandidate);
                }
            }

            // Strategy 3: Heuristic Fallback (Largest PNG in Payload/*.app/)
            if (!iconBuffer) {
                const candidateEntries = Object.values(entries).filter(e => {
                    const name = e.name;
                    if (!/^Payload\/[^/]+\.app\//.test(name)) return false;
                    return name.endsWith('.png') || name.endsWith('.jpg');
                });
                candidateEntries.sort((a, b) => b.size - a.size);
                if (candidateEntries.length > 0) {
                    const bestCandidate = candidateEntries[0];
                    console.log(`[Parser] IPA Heuristic: Found largest likely icon: ${bestCandidate.name}`);
                    iconBuffer = await zip.entryData(bestCandidate);
                }
            }
        }

    } catch (e: any) {
        console.warn("[Parser] Zip fallback failed:", e);
    } finally {
        await zip.close();
    }
    return iconBuffer;
}

export async function parseAppFile(filePath: string): Promise<AppMetadata> {
    const ext = path.extname(filePath).toLowerCase();
    const parser = new AppInfoParser(filePath);

    try {
        const result = await parser.parse();
        const anyResult = result as any;

        // 1. Try to get icon from parser result
        let finalIcon: Buffer | undefined = undefined;

        // Normalize parser output to buffer if possible
        let parserIcon: Buffer | undefined;
        if (Buffer.isBuffer(anyResult.icon)) {
            parserIcon = anyResult.icon;
        } else if (typeof anyResult.icon === 'string' && anyResult.icon.length > 0) {
            // Check if it looks like base64 (simple heuristic)
            if (!anyResult.icon.includes('/') && !anyResult.icon.includes('\\')) {
                parserIcon = Buffer.from(anyResult.icon, 'base64');
            }
        }

        // Validate the parser's icon
        if (parserIcon && isValidImage(parserIcon)) {
            finalIcon = parserIcon;
        } else {
            console.warn("[Parser] Parser returned invalid icon buffer (header mismatch). Attempting fallback...");
            // 2. Fallback to manual zip extraction
            if (ext === '.apk') {
                finalIcon = await findIconInZip(filePath);
            }
        }

        let metadata: AppMetadata;

        if (ext === '.apk') {
            const manifest = result as any;
            const label = Array.isArray(manifest.application.label)
                ? manifest.application.label[0]
                : manifest.application.label;

            metadata = {
                os: 'android',
                name: label || 'Unknown Android App',
                version: manifest.versionName || '1.0',
                buildNumber: manifest.versionCode ? manifest.versionCode.toString() : '1',
                bundleId: manifest.package,
                icon: finalIcon
            };

        } else if (ext === '.ipa') {
            if (!finalIcon) {
                finalIcon = await findIconInZip(filePath);
            }

            const info = result as any;
            metadata = {
                os: 'ios',
                name: info.CFBundleDisplayName || info.CFBundleName || 'Unknown iOS App',
                version: info.CFBundleShortVersionString || '1.0',
                buildNumber: info.CFBundleVersion || '1',
                bundleId: info.CFBundleIdentifier,
                icon: finalIcon
            };
        } else {
            throw new Error('Unsupported file extension');
        }

        return metadata;

    } catch (e: any) {
        console.error("Parse error:", e);
        throw new Error(`Failed to parse app file: ${e.message}`);
    }
}
