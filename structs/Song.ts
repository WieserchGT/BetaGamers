import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL } from "../utils/patterns";
import ytdl from "@distube/ytdl-core";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const DEBUG_AUDIO = process.env.DEBUG_AUDIO === '1';
const LAST_DEBUG_PATH = process.env.LAST_DEBUG_PATH || path.join(process.cwd(), 'logs', 'last-debug.log');
const dwrite = (line: string) => { 
  try { 
    fs.appendFileSync(LAST_DEBUG_PATH, line + "\n"); 
  } catch {} 
};

const dlog = (...args: any[]) => {
  if (!DEBUG_AUDIO) return;
  const line = `[audio] ${new Date().toISOString()} ` + args.map(a => {
    try { 
      return typeof a === 'string' ? a : JSON.stringify(a); 
    } catch { 
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
  requestedBy?: string;
}

export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: number;
  public readonly requestedBy?: string;

  public constructor({ url, title, duration, requestedBy }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.requestedBy = requestedBy;
  }

  public static async from(url: string = "", search: string = ""): Promise<Song> {
    const isYoutubeUrl = videoPattern.test(url);

    try {
      let videoUrl = url;
      
      // Si no es una URL de YouTube, buscar el video
      if (!isYoutubeUrl && search) {
        dlog('song.search', { search });
        const result = await youtube.searchOne(search).catch(() => null);
        
        if (!result) {
          const err = new Error(`No search results found for ${search}`);
          err.name = "NoResults";
          throw err;
        }
        
        videoUrl = `https://youtube.com/watch?v=${result.id}`;
        dlog('song.search.found', { title: result.title, url: videoUrl });
      }

      // Usar @distube/ytdl-core para obtener información del video
      dlog('song.ytdl.getInfo', { url: videoUrl });
      const info = await ytdl.getInfo(videoUrl);
      const videoDetails = info.videoDetails;

      return new this({
        url: videoDetails.video_url,
        title: videoDetails.title,
        duration: parseInt(videoDetails.lengthSeconds),
        requestedBy: ""
      });
      
    } catch (error: any) {
      dlog('song.from.error', { error: error.message, url, search });
      
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        const rateLimitError = new Error('RATE_LIMITED');
        rateLimitError.name = "RateLimited";
        throw rateLimitError;
      }
      
      if (error.name === "NoResults") throw error;
      
      if (isURL.test(url)) {
        const invalidUrlError = new Error(`Invalid URL: ${url}`);
        invalidUrlError.name = "InvalidURL";
        throw invalidUrlError;
      }
      
      throw error;
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    if (!this.url) {
      console.error("[ERROR] Song URL is undefined or empty");
      return;
    }

    dlog('song.makeResource.start', { title: this.title, url: this.url });
    const t0 = Date.now();

    try {
      // Usar ytdl-core para crear el stream de audio directamente
      const audioStream = ytdl(this.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // 32MB buffer
        dlChunkSize: 0, // disable chunking
      });

      audioStream.once('info', () => dlog('song.ytdl.stream.info'));
      
      audioStream.on('error', (error) => {
        dlog('song.ytdl.stream.error', { message: error.message });
      });

      const resource = createAudioResource(audioStream, {
        metadata: this,
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });

      dlog('song.makeResource.done', { ms: Date.now() - t0 });
      return resource;

    } catch (error: any) {
      dlog('song.makeResource.error', { message: error.message });
      throw error;
    }
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}
