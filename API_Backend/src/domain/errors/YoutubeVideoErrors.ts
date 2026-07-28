export class YoutubeVideoNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el video con ID ${id}`);
    this.name = 'YoutubeVideoNotFoundError';
  }
}

export class InvalidYoutubeUrlError extends Error {
  constructor() {
    super('URL de YouTube inválida. Asegúrate de que sea un enlace válido de YouTube.');
    this.name = 'InvalidYoutubeUrlError';
  }
}
