import crypto from "crypto";

export function generateSlug(length = 6): string {
    const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const randomBytes = crypto.randomBytes(length);

    let slug = "";

    for (let i = 0; i < length; i++) {
        const byte = randomBytes[i];
        if (byte !== undefined) {
            slug += characters[byte % characters.length] ?? "";
        }
    }

    return slug;
}