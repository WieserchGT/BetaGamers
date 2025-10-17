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

  public static async from(url: string = "", search: string = "") {
    const isYoutubeUrl = videoPattern.test(url);

    try {
      let videoUrl = url;
      
      // Si no es una URL de YouTube, buscar el video
      if (!isYoutubeUrl && search) {
        dlog('song
