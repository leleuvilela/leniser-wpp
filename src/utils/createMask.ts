import sharp from "sharp";

export async function createMask(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const squareSize = Math.min(metadata.width, metadata.height) * 0.5; // 50% of the smallest dimension
  const x = (metadata.width - squareSize) / 2;
  const y = (metadata.height - squareSize) / 2;

  // Create an SVG with a transparent square in the middle
  const svgBuffer = Buffer.from(
    `<svg width="${metadata.width}" height="${metadata.height}">
          <rect x="0" y="0" width="${metadata.width}" height="${metadata.height}" fill="black" />
          <rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="white" />
      </svg>`
  );

  // Composite the SVG onto a transparent image to create the mask
  const maskBuffer = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: svgBuffer, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return maskBuffer;
}