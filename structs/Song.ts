import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL } from "../utils/patterns";
import youtubedl from "youtube-dl-exec";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const DEBUG_AUDIO = process.env.DEBUG_AUDIO === '1';
const LAST_DEBUG_PATH = process.env.LAST_DEBUG_PATH || path.join(process.cwd(), 'logs', 'last-debug.log');
const dwrite = (line: string) => { try { fs.appendFileSync(LAST_DEBUG_PATH, line + "\n"); } catch {} };
const dlog = (...args: any[]) => {
  if (!DEBUG_AUDIO) return;
  const line = `[audio] ${new Date().toISOString()} ` + args.map(a => {
    try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
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
    const isYoutubeUrl = videoPattern.test(url);

    if (isYoutubeUrl) {
      const video = await youtube.getVideo(url);
      
      return new this({
        url: video.url,
        title: video.title || "Unknown Title",
        duration: video.duration / 1000
      });
    } else {
      const result = await youtube.searchOne(search);

      if (!result) {
        let err = new Error(`No search results found for ${search}`);
        err.name = "NoResults";
        if (isURL.test(url)) err.name = "InvalidURL";
        throw err;
      }

      const video = await youtube.getVideo(`https://youtube.com/watch?v=${result.id}`);
      
      return new this({
        url: video.url,
        title: video.title || "Unknown Title",
        duration: video.duration / 1000
      });
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    if (!this.url) {
      console.error("[ERROR] Song URL is undefined or empty");
      return;
    }

    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `evobot-${Date.now()}.webm`);

    dlog('song.makeResource.start', { title: this.title, url: this.url, tmpFilePath });
    const t0 = Date.now();

    const proc = youtubedl.exec(this.url, {
      output: tmpFilePath,
      format: 'bestaudio[ext=webm]/bestaudio/best',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    return new Promise((resolve, reject) => {
      proc.once('spawn', () => dlog('song.download.spawn'));

      proc.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        dlog('song.download.stderr', msg.trim());
      });

      proc.on('error', (err) => {
        dlog('song.download.error', { message: (err as Error)?.message });
        reject(err);
      });

      proc.once('close', (code: number) => {
        dlog('song.download.close', { code, ms: Date.now() - t0 });
        if (code !== 0) {
          return reject(new Error(`yt-dlp exited with code ${code}`));
        }

        try {
          const stat = fs.statSync(tmpFilePath);
          dlog('song.file.ready', { bytes: stat.size });
        } catch {}

        const stream = fs.createReadStream(tmpFilePath);
        stream.once('open', () => dlog('song.stream.open'));
        stream.once('error', (err) => {
          dlog('song.stream.error', { message: (err as Error)?.message });
          reject(err);
        });

        const resource = createAudioResource(stream, {
          metadata: this,
          inputType: StreamType.WebmOpus,
          inlineVolume: true
        });

        stream.once('close', () => {
          dlog('song.stream.close');
          fs.unlink(tmpFilePath, (err) => {
            if (err) console.error(`[ERROR] Failed to delete temp file: ${tmpFilePath}`, err);
            else dlog('song.file.deleted');
          });
        });

        dlog('song.makeResource.done', { ms: Date.now() - t0 });
        resolve(resource);
      });
    });
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}
