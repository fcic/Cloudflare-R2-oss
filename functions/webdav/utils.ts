export interface RequestHandlerParams {
    bucket: R2Bucket;
    path: string;
    request: Request;
}

export const WEBDAV_ENDPOINT = "/webdav/";

export const ROOT_OBJECT = {
    key: "",
    uploaded: new Date(),
    httpMetadata: {
        contentType: "application/x-directory",
        contentDisposition: undefined,
        contentLanguage: undefined,
    },
    customMetadata: undefined,
    size: 0,
    etag: undefined,
};

export function notFound() {
    return new Response("Not found", { status: 404 });
}

export function parseBucketPath(context: any): [R2Bucket, string] {
    const { request, env, params } = context;
    const url = new URL(request.url);

    const pathSegments = (params.path || []) as String[];
    const path = decodeURIComponent(pathSegments.join("/"));
    const driveid = url.hostname.replace(/\..*/, "");

    return [env[driveid] || env["BUCKET"], path];
}

// Create a virtual directory object for prefix-based folders (web-created)
export function makeVirtualDir(prefix: string) {
    const key = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    return {
        key,
        uploaded: new Date(),
        httpMetadata: {
            contentType: "application/x-directory",
            contentDisposition: undefined,
            contentLanguage: undefined,
        },
        customMetadata: undefined,
        size: 0,
        etag: undefined,
    };
}

export async function* listAll(
    bucket: R2Bucket,
    prefix?: string,
    isRecursive: boolean = false
) {
    let cursor: string | undefined = undefined;
    do {
        var r2Objects = await bucket.list({
            prefix: prefix,
            delimiter: isRecursive ? undefined : "/",
            cursor: cursor,
            // @ts-ignore
            include: ["httpMetadata", "customMetadata"],
        });

        // Track keys we've already yielded to avoid duplicates
        const yieldedKeys = new Set<string>();

        for await (const obj of r2Objects.objects) {
            if (obj.key.startsWith("_$flaredrive$/")) continue;
            // Skip _$folder$ marker objects (web convention) — we handle them via delimitedPrefixes
            if (obj.key.endsWith("/_$folder$")) continue;
            yieldedKeys.add(obj.key);
            yield obj;
        }

        // Also yield virtual directory objects for prefix-based folders
        // These are folders created by the web UI that exist only as common prefixes
        if (!isRecursive && r2Objects.delimitedPrefixes) {
            for (const delPrefix of r2Objects.delimitedPrefixes) {
                if (delPrefix.startsWith("_$flaredrive$/")) continue;
                const dirKey = delPrefix.endsWith("/") ? delPrefix.slice(0, -1) : delPrefix;
                // Only yield if we haven't already yielded an object with this key
                // (e.g., a WebDAV-created directory marker)
                if (!yieldedKeys.has(dirKey)) {
                    yield makeVirtualDir(delPrefix) as any;
                }
            }
        }

        if (r2Objects.truncated) cursor = r2Objects.cursor;
    } while (r2Objects.truncated);
}

// Check if a path is a directory (either has a marker object or has children)
export async function isDirectory(
    bucket: R2Bucket,
    path: string
): Promise<{ isDir: boolean; obj: any }> {
    // Check for WebDAV-style directory marker
    const obj = await bucket.head(path);
    if (obj) {
        return {
            isDir: obj.httpMetadata?.contentType === "application/x-directory",
            obj,
        };
    }

    // Check for web-style _$folder$ marker
    const folderMarker = await bucket.head(path + "/_$folder$");
    if (folderMarker) {
        return { isDir: true, obj: makeVirtualDir(path) };
    }

    // Check if there are any objects with this prefix (implicit folder)
    const listing = await bucket.list({
        prefix: path + "/",
        limit: 1,
    });
    if (listing.objects.length > 0) {
        return { isDir: true, obj: makeVirtualDir(path) };
    }

    return { isDir: false, obj: null };
}
