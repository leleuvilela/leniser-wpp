import ffmpeg = require('fluent-ffmpeg');
import { PassThrough, Readable } from "stream";
import { MessageMedia } from "whatsapp-web.js";

export function convertToMp3(media: MessageMedia): Promise<string> {
    return new Promise((resolve, reject) => {

        const base64String = media.data;

        // Decode base64 string to a buffer
        const audioBuffer: Buffer = Buffer.from(base64String, 'base64');

        // Create a readable stream from the buffer
        const inputStream = new Readable();
        inputStream.push(audioBuffer);
        inputStream.push(null);

        // Create a passthrough stream to capture the ffmpeg output
        const outputStream = new PassThrough();

        // Convert the audio using ffmpeg
        ffmpeg(inputStream)
            .toFormat('mp3')
            .audioCodec('libmp3lame')
            .audioQuality(2)
            .on('end', () => {
                console.log('Conversion finished!');
            })
            .on('error', (err: Error) => {
                console.error('Error occurred:', err);
                reject(err);
            })
            .pipe(outputStream);

        // Collect the output stream data and convert it back to a base64 string
        const chunks: Buffer[] = [];
        outputStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        outputStream.on('end', () => {
            const outputBuffer = Buffer.concat(chunks);
            const outputBase64 = outputBuffer.toString('base64');
            resolve(outputBase64);
        });

        outputStream.on('error', (err: Error) => {
            reject(err);
        });
    });
};
