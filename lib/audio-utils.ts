
export class AudioUtils {
  // static convertToWav(audioBuffer: Buffer, inputFormat: string = 'webm'): Promise<Buffer> {
  //   return new Promise((resolve, reject) => {
  //     const inputStream = Readable.from(audioBuffer);
      
  //     const chunks: Buffer[] = [];
  //     const command = ffmpeg(inputStream)
  //       .inputFormat(inputFormat)
  //       .audioChannels(1)
  //       .audioFrequency(16000)
  //       .audioCodec('pcm_s16le')
  //       .format('wav')
  //       .on('error', (err: Error) => {
  //         reject(new Error(`Audio conversion failed: ${err.message}`));
  //       })
  //       .on('end', () => {
  //         resolve(Buffer.concat(chunks));
  //       });

  //     const outputStream = command.pipe();
  //     outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
  //   });
  // }

  static validateAudioFormat(mimeType: string): boolean {
    const supportedFormats = [
      'audio/wav',
      'audio/webm',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg'
    ];
    
    return supportedFormats.includes(mimeType);
  }

  static getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg'
    };
    
    return extensions[mimeType] || 'wav';
  }
}