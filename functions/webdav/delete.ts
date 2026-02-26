import { notFound } from "./utils";
import { isDirectory, listAll, RequestHandlerParams } from "./utils";

export async function handleRequestDelete({
    bucket,
    path,
}: RequestHandlerParams) {
    if (path !== "") {
        // Check if it's a real object
        const obj = await bucket.head(path);
        if (obj === null) {
            // Maybe it's a web-style folder (only _$folder$ marker, no directory object)
            const result = await isDirectory(bucket, path);
            if (!result.isDir) return notFound();
        } else {
            await bucket.delete(path);
            if (obj.httpMetadata?.contentType !== "application/x-directory")
                return new Response(null, { status: 204 });
        }
    }

    // Delete all children (handles both real directories and prefix-based folders)
    const children = listAll(bucket, path === "" ? undefined : `${path}/`, true);
    for await (const child of children) {
        await bucket.delete(child.key);
    }

    // Also clean up any _$folder$ markers in the tree
    let cursor: string | undefined = undefined;
    do {
        const listing = await bucket.list({
            prefix: path === "" ? undefined : `${path}/`,
            cursor,
        });
        for (const obj of listing.objects) {
            if (obj.key.endsWith("/_$folder$")) {
                await bucket.delete(obj.key);
            }
        }
        cursor = listing.truncated ? listing.cursor : undefined;
    } while (cursor);

    // Delete the _$folder$ marker for this directory itself
    if (path !== "") {
        try { await bucket.delete(path + "/_$folder$"); } catch { }
    }

    return new Response(null, { status: 204 });
}
