export class AudioUtils {
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