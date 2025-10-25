import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import { i18n } from "../utils/i18n";
import { videoPattern } from "../utils/patterns";
import play from "play-dl";

// Configuración de depuración
const DEBUG_AUDIO = process.env.DEBUG_AUDIO === '1';

const dlog = (...args: any[]) => {
  if (!DEBUG_AUDIO) return;
  const line = `[audio] ${new Date().toISOString()} ` + args.map(a => 
    typeof a === 'string' ? a : JSON.stringify(a, null, 2)
  ).join(' ');
  console.log(line);
};

export interface SongData {
  url: string;
  title: string;
  duration: number;
}

export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: number;

  public constructor({ url, title, duration }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
  }

  public static async from(url: string = "", search: string = "") {
    try {
      const isYoutubeUrl = videoPattern.test(url);

      dlog(`Procesando: ${url || search}`, { isYoutubeUrl });

      if (isYoutubeUrl) {
        dlog(`Procesando URL de YouTube: ${url}`);
        
        try {
          // Usar play-dl para obtener información del video
          const videoInfo = await play.video_info(url);
          const videoDetails = videoInfo.video_details;

          if (!videoDetails) {
            throw new Error("No se pudo obtener información del video");
          }

          return new this({
            url: videoDetails.url,
            title: videoDetails.title || 'Título desconocido',
            duration: videoDetails.durationInSec || 0
          });

        } catch (playError: any) {
          dlog(`Error con play-dl: ${playError.message}`);
          throw new Error(`No se pudo obtener información del video: ${playError.message}`);
        }

      } else if (search) {
        dlog(`Buscando: ${search}`);
        
        try {
          // Usar play-dl para búsqueda
          const searchResults = await play.search(search, { limit: 1 });
          
          if (!searchResults || searchResults.length === 0) {
            throw new Error(`No se encontraron resultados para: ${search}`);
          }

          const result = searchResults[0];
          
          return new this({
            url: result.url,
            title: result.title || 'Título desconocido',
            duration: result.durationInSec || 0
          });

        } catch (searchError: any) {
          dlog(`Error en la búsqueda: ${searchError.message}`);
          throw new Error(`Error al buscar el video: ${searchError.message}`);
        }
      } else {
        throw new Error('Se requiere una URL o término de búsqueda');
      }
    } catch (error: any) {
      dlog(`Error en Song.from: ${error}`);
      
      // Convertir errores de play-dl a errores reconocibles
      if (error.message?.includes("No se encontraron resultados") || 
          error.message?.includes("No results")) {
        throw new Error("NoResults");
      }
      
      throw error;
    }
  }

  public async makeResource(): Promise<AudioResource<Song>> {
    if (!this.url) {
      throw new Error('La URL de la canción no está definida');
    }

    dlog('Iniciando makeResource', { title: this.title, url: this.url });

    try {
      // Usar play-dl para obtener el stream de audio
      const stream = await play.stream(this.url);
      
      dlog('Stream obtenido', { 
        title: this.title, 
        type: stream.type
        // NOTA: stream.quality fue eliminado porque no existe en todos los tipos de stream
      });

      const resource = createAudioResource(stream.stream, {
        metadata: this,
        inputType: stream.type,
        inlineVolume: true
      });

      dlog('makeResource completado', { title: this.title });

      return resource;
    } catch (error: any) {
      dlog(`Error en makeResource: ${error}`);
      
      if (error.message?.includes("Sign in to confirm") || 
          error.message?.includes("cookies")) {
        throw new Error("YouTube está bloqueando las descargas. Se requieren cookies de autenticación.");
      }
      
      throw new Error(`No se pudo crear el recurso de audio: ${error.message}`);
    }
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }

  // Método auxiliar para formatear duración
  public get formattedDuration(): string {
    if (!this.duration) return "0:00";
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}