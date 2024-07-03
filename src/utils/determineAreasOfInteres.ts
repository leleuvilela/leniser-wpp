import sharp from "sharp";

export async function determineAreaOfInterest(imageBuffer: Buffer): Promise<{ x: number, y: number, width: number, height: number }> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  // This example assumes the area of interest is in the center of the image
  // You can replace this with more sophisticated logic if needed
  const x = metadata.width ? metadata.width * 0.25 : 0;
  const y = metadata.height ? metadata.height * 0.25 : 0;
  const width = metadata.width ? metadata.width * 0.5 : 0;
  const height = metadata.height ? metadata.height * 0.5 : 0;

  return { x, y, width, height };
}