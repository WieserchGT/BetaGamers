import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL } from "../utils/patterns";
import youtubedl from "youtube-dl-exec";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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

      // Verificar si existe archivo de cookies
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      const hasCookies = fs.existsSync(cookiesPath);

      // Opciones comunes para youtube-dl-exec
      const baseOptions: any = {
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ],
        socketTimeout: 60000,
        forceIpv4: true,
        retries: 3
      };

      // Agregar cookies si existen
      if (hasCookies) {
        baseOptions.cookies = cookiesPath;
        dlog('Usando cookies.txt para obtener información del video');
      }

      if (isYoutubeUrl) {
        dlog(`Procesando URL de YouTube: ${url}`);
        
        // Primero intentar con youtube-sr que es más confiable
        try {
          const video = await youtube.getVideo(url);
          if (video) {
            return new this({
              url: `https://youtube.com/watch?v=${video.id}`,
              title: video.title || 'Título desconocido',
              duration: video.duration || 0
            });
          }
        } catch (srError) {
          dlog(`YouTube-SR falló, usando youtube-dl-exec: ${srError}`);
        }

        // Fallback a youtube-dl-exec
        const videoInfo: any = await youtubedl(url, {
          ...baseOptions,
          dumpSingleJson: true
        }).catch((error: any) => {
          dlog(`Error al obtener información del video: ${error.message}`);
          throw new Error(`No se pudo obtener información del video: ${error.message}`);
        });

        return new this({
          url: videoInfo.webpage_url || videoInfo.url || url,
          title: videoInfo.title || 'Título desconocido',
          duration: videoInfo.duration || 0
        });
      } else if (search) {
        dlog(`Buscando: ${search}`);
        
        // Usar youtube-sr para búsqueda (más confiable)
        const result = await youtube.searchOne(search).catch((error: any) => {
          dlog(`Error en la búsqueda: ${error.message}`);
          throw new Error(`Error al buscar el video: ${error.message}`);
        });

        if (!result) {
          throw new Error(`No se encontraron resultados para: ${search}`);
        }

        return new this({
          url: `https://youtube.com/watch?v=${result.id}`,
          title: result.title || 'Título desconocido',
          duration: result.duration || 0
        });
      } else {
        throw new Error('Se requiere una URL o término de búsqueda');
      }
    } catch (error: any) {
      dlog(`Error en Song.from: ${error}`);
      throw error;
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    if (!this.url) {
      throw new Error('La URL de la canción no está definida');
    }

    dlog('Iniciando makeResource', { title: this.title, url: this.url });

    try {
      // Verificar si existe archivo de cookies
      const cookiesPath = path.join(process.cwd(), 'cookies.txt');
      const hasCookies = fs.existsSync(cookiesPath);

      const options: any = {
        format: 'bestaudio[ext=webm]/bestaudio/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ],
        socketTimeout: 60000,
        forceIpv4: true,
        retries: 3,
        output: '-'
      };

      // AGREGAR COOKIES SI EXISTEN - ESTA LÍNEA ES CRÍTICA
      if (hasCookies) {
        options.cookies = cookiesPath;
        dlog('Usando cookies.txt para descarga de audio');
      } else {
        dlog('ADVERTENCIA: No se encontró cookies.txt - YouTube puede bloquear la descarga');
      }

      const proc = youtubedl.exec(this.url, options);

      const resource = createAudioResource(proc.stdout!, {
        metadata: this,
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });

      dlog('makeResource completado', { title: this.title });

      proc.on('error', (error: any) => {
        dlog(`Error en el proceso de descarga: ${error}`);
      });

      proc.on('close', (code: any) => {
        dlog(`Proceso de descarga finalizado con código: ${code}`);
      });

      return resource;
    } catch (error: any) {
      dlog(`Error en makeResource: ${error}`);
      throw error;
    }
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}