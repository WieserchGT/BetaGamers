import { AudioResource, createAudioResource } from "@discordjs/voice";
import { i18n } from "../utils/i18n";
import { videoPattern } from "../utils/patterns";
import play from "play-dl";

const DEBUG_AUDIO = process.env.DEBUG_AUDIO === '1';

const dlog = (...args: any[]) => {
  if (!DEBUG_AUDIO) return;
  console.log('[audio]', ...args);
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
      dlog('Procesando:', url || search);

      if (isYoutubeUrl) {
        dlog('URL de YouTube:', url);
        const videoInfo = await play.video_info(url);
        const videoDetails = videoInfo.video_details;

        if (!videoDetails) {
          throw new Error("No video details");
        }

        return new this({
          url: videoDetails.url,
          title: videoDetails.title || 'Unknown',
          duration: videoDetails.durationInSec || 0
        });

      } else if (search) {
        dlog('Buscando:', search);
        const searchResults = await play.search(search, { limit: 1 });
        
        if (!searchResults.length) {
          throw new Error("No results");
        }

        const result = searchResults[0];
        return new this({
          url: result.url,
          title: result.title || 'Unknown',
          duration: result.durationInSec || 0
        });

      } else {
        throw new Error('URL or search required');
      }
    } catch (error: any) {
      dlog('Error en Song.from:', error);
      if (error.message?.includes("No results")) {
        throw new Error("NoResults");
      }
      throw error;
    }
  }

  public async makeResource(): Promise<AudioResource<Song>> {
    if (!this.url) throw new Error('No URL');
    dlog('makeResource:', this.title);

    try {
      const stream = await play.stream(this.url, { quality: 0 });
      
      const resource = createAudioResource(stream.stream, {
        metadata: this,
        inputType: stream.type,
        inlineVolume: true
      });

      return resource;
    } catch (error: any) {
      dlog('Error makeResource:', error);
      throw new Error(`No se puede reproducir: ${error.message}`);
    }
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }

  public get formattedDuration(): string {
    if (!this.duration) return "0:00";
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}