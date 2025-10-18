import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL } from "../utils/patterns";
import youtubedl from "youtube-dl-exec";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Configuración de depuración con valores por defecto
const DEBUG_AUDIO = process.env.DEBUG_AUDIO === '1';
const LOGS_DIR = path.join(process.cwd(), 'logs');
const LAST_DEBUG_PATH = process.env.LAST_DEBUG_PATH || path.join(LOGS_DIR, 'last-debug.log');

// Asegurar que el directorio de logs exista
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (error) {
  console.warn(`[WARN] No se pudo crear el directorio de logs: ${error}`);
}

const dwrite = (line: string) => { 
  try { 
    fs.appendFileSync(LAST_DEBUG_PATH, line + "\n"); 
  } catch (error) {
    console.error(`[ERROR] No se pudo escribir en el archivo de log: ${error}`);
  } 
};

const dlog = (...args: any[]) => {
  if (!DEBUG_AUDIO) return;
  const line = `[audio] ${new Date().toISOString()} ` + args.map(a => {
    try { 
      return typeof a === 'string' ? a : JSON.stringify(a, null, 2); 
    } catch (error) { 
      return String(a); 
    }
  }).join(' ');
  
  console.log(line);
  dwrite(line);
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

      if (isYoutubeUrl) {
        dlog(`Procesando URL de YouTube: ${url}`);
        const videoInfo: any = await youtubedl(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
          socketTimeout: 30000, // 30 segundos de timeout
          forceIpv4: true
        }).catch(error => {
          dlog(`Error al obtener información del video: ${error.message}`);
          throw new Error(`No se pudo obtener información del video: ${error.message}`);
        });

        if (!videoInfo || !videoInfo.title) {
          throw new Error('La respuesta de la API de YouTube no contiene la información esperada');
        }

        return new this({
          url: videoInfo.webpage_url || videoInfo.url || url,
          title: videoInfo.title || 'Título desconocido',
          duration: videoInfo.duration || 0
        });
      } else if (search) {
        dlog(`Buscando: ${search}`);
        const result = await youtube.searchOne(search).catch(error => {
          dlog(`Error en la búsqueda: ${error.message}`);
          throw new Error(`Error al buscar el video: ${error.message}`);
        });

        if (!result) {
          const err = new Error(`No se encontraron resultados para: ${search}`);
          err.name = isURL.test(url) ? "InvalidURL" : "NoResults";
          throw err;
        }

        const videoUrl = `https://youtube.com/watch?v=${result.id}`;
        dlog(`Video encontrado: ${result.title} (${videoUrl})`);
        
        const videoInfo: any = await youtubedl(videoUrl, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
          socketTimeout: 30000,
          forceIpv4: true
        }).catch(error => {
          dlog(`Error al obtener información del video encontrado: ${error.message}`);
          throw new Error(`No se pudo obtener información del video: ${error.message}`);
        });

        return new this({
          url: videoInfo.webpage_url || videoUrl,
          title: videoInfo.title || result.title || 'Título desconocido',
          duration: videoInfo.duration || 0
        });
      } else {
        throw new Error('Se requiere una URL o término de búsqueda');
      }
    } catch (error) {
      dlog(`Error en Song.from: ${error}`);
      throw error; // Relanzar el error para manejarlo en el código que llama
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    if (!this.url) {
      const errorMsg = '[ERROR] La URL de la canción no está definida o está vacía';
      dlog(errorMsg);
      throw new Error(errorMsg);
    }

    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `evobot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webm`);

    dlog('Iniciando makeResource', { 
      title: this.title, 
      url: this.url, 
      tmpFilePath,
      tmpDir: fs.existsSync(tmpDir) ? 'existe' : 'no existe',
      tmpDirWritable: (() => {
        try {
          fs.accessSync(tmpDir, fs.constants.W_OK);
          return 'escribible';
        } catch {
          return 'no escribible';
        }
      })()
    });

    const t0 = Date.now();

    try {
      const proc = youtubedl.exec(this.url, {
        output: tmpFilePath,
        format: 'bestaudio[ext=webm]/bestaudio/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        socketTimeout: 30000,
        forceIpv4: true
      });

      // Verificar si el proceso se inició correctamente
      if (!proc || !proc.stdout) {
        throw new Error('No se pudo iniciar el proceso de descarga');
      }

      const resource = createAudioResource(proc.stdout, {
        metadata: this,
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });

      dlog('makeResource completado', { 
        title: this.title, 
        duration: Date.now() - t0 + 'ms',
        tmpFileExists: fs.existsSync(tmpFilePath) ? 'sí' : 'no',
        tmpFileSize: fs.existsSync(tmpFilePath) ? (fs.statSync(tmpFilePath).size / 1024 / 1024).toFixed(2) + 'MB' : 'no existe'
      });

      // Manejador de errores para el proceso
      proc.on('error', (error) => {
        dlog(`Error en el proceso de descarga: ${error}`);
        try {
          if (fs.existsSync(tmpFilePath)) {
            fs.unlinkSync(tmpFilePath);
          }
        } catch (e) {
          dlog(`Error al limpiar archivo temporal: ${e}`);
        }
      });

      // Limpieza del archivo temporal después de usarlo
      proc.on('close', (code) => {
        dlog(`Proceso de descarga finalizado con código: ${code}`);
        try {
          if (fs.existsSync(tmpFilePath)) {
            fs.unlinkSync(tmpFilePath);
            dlog(`Archivo temporal eliminado: ${tmpFilePath}`);
          }
        } catch (error) {
          dlog(`Error al eliminar archivo temporal: ${error}`);
        }
      });

      return resource;
    } catch (error) {
      dlog(`Error en makeResource: ${error}`);
      // Intentar limpiar el archivo temporal en caso de error
      try {
        if (fs.existsSync(tmpFilePath)) {
          fs.unlinkSync(tmpFilePath);
        }
      } catch (e) {
        dlog(`Error al limpiar archivo temporal después del error: ${e}`);
      }
      throw error; // Relanzar el error para manejarlo en el código que llama
    }
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}
