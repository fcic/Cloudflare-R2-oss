import { RequestHandlerParams, ROOT_OBJECT } from "./utils";

export async function handleRequestMkcol({
    bucket,
    path,
    request,
}: RequestHandlerParams) {
    // Check if the resource already exists
    const resource = await bucket.head(path);
    if (resource !== null) {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // Check if the parent directory exists
    const parentPath = path.replace(/(\/|^)[^/]*$/, "");
    const parentDir =
        parentPath === "" ? ROOT_OBJECT : await bucket.head(parentPath);
    // Also check for web-style _$folder$ marker or prefix-based parent
    let parentExists = parentDir !== null;
    if (!parentExists && parentPath !== "") {
        const folderMarker = await bucket.head(parentPath + "/_$folder$");
        if (folderMarker) parentExists = true;
        if (!parentExists) {
            const listing = await bucket.list({ prefix: parentPath + "/", limit: 1 });
            if (listing.objects.length > 0) parentExists = true;
        }
    }
    if (!parentExists && parentPath !== "") return new Response("Conflict", { status: 409 });

    // Create WebDAV-style directory marker
    await bucket.put(path, "", {
        httpMetadata: { contentType: "application/x-directory" },
    });

    // Also create web-style _$folder$ marker for web UI compatibility
    await bucket.put(path + "/_$folder$", "");

    return new Response("Created", { status: 201 });
}
