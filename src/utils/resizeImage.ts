import sharp from 'sharp';

export async function resizeImage(base64Image: string, maxSizeMB: number): Promise<Buffer> {
    // Convert base64 string to Buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    let image = sharp(imageBuffer).ensureAlpha();

    // Check initial metadata
    const metadata = await image.metadata();
    let fileSizeMB = metadata.size ? metadata.size / (1024 * 1024) : 0;

    if (fileSizeMB > maxSizeMB) {
        const resizeOptions = {
            width: metadata.width ? Math.round(metadata.width * 0.8) : undefined,
            height: metadata.height ? Math.round(metadata.height * 0.8) : undefined,
            fit: sharp.fit.inside,
            withoutEnlargement: true
        };

        // Resize the image
        image = image.resize(resizeOptions);

        // Adjust quality to further reduce size and ensure the output is in PNG format
        image = image.png({ quality: 80 });

        const outputBuffer = await image.toBuffer();
        const newMetadata = await sharp(outputBuffer).metadata();
        fileSizeMB = newMetadata.size ? newMetadata.size / (1024 * 1024) : 0;

        // Recursive call to further reduce size if needed
        if (fileSizeMB > maxSizeMB) {
            return resizeImage(outputBuffer.toString('base64'), maxSizeMB);
        }

        return outputBuffer;
    }

    // Ensure the output is in PNG format even if no resizing is needed
    return image.png().toBuffer();
}