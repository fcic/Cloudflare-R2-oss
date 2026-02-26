import { notFound, parseBucketPath } from "@/utils/bucket";

export async function onRequestGet(context) {
  try {
    const [bucket, path] = parseBucketPath(context);
    const prefix = path && `${path}/`;
    if (!bucket || prefix.startsWith("_$flaredrive$/")) return notFound();

    const objList = await bucket.list({
      prefix,
      delimiter: "/",
      include: ["httpMetadata", "customMetadata"],
    });
    // Separate WebDAV-style directory objects from regular files
    const dirObjects: string[] = [];
    const objKeys = objList.objects
      .filter((obj) => {
        // Filter out _$folder$ markers (web convention)
        if (obj.key.endsWith("/_$folder$")) return false;
        // Filter out WebDAV-style directory objects, but collect them as folders
        if (obj.httpMetadata?.contentType === "application/x-directory") {
          dirObjects.push(obj.key + "/");
          return false;
        }
        return true;
      })
      .map((obj) => {
        const { key, size, uploaded, httpMetadata, customMetadata } = obj;
        return { key, size, uploaded, httpMetadata, customMetadata };
      });

    let folders = objList.delimitedPrefixes;
    if (!path)
      folders = folders.filter((folder) => folder !== "_$flaredrive$/");
    // Merge WebDAV-style directory objects into folders list (deduplicate)
    for (const dir of dirObjects) {
      if (!folders.includes(dir)) folders.push(dir);
    }
    folders.sort();

    return new Response(JSON.stringify({ value: objKeys, folders }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
}
