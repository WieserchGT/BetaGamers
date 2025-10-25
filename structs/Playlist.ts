import { Song } from "./Song";
import play from "play-dl";
import { config } from "../utils/config";

const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/i;

export class Playlist {
  public readonly data: Song[];
  public readonly title: string;

  constructor({ data, title }: { data: Song[]; title: string }) {
    this.data = data;
    this.title = title;
  }

  public static async from(url: string = "", search: string = ""): Promise<Playlist | null> {
    try {
      const urlValid = pattern.test(url);
      
      // Si no es una URL válida de playlist, no podemos buscarla
      if (!urlValid) {
        throw new Error("Se requiere una URL válida de playlist de YouTube");
      }

      // Usar play-dl para obtener información de playlist
      const playlistInfo = await play.playlist_info(url);
      const videos = await playlistInfo.all_videos();

      const songs = videos
        .filter((video: any) => video.title != "Private video" && video.title != "Deleted video")
        .slice(0, config.MAX_PLAYLIST_SIZE - 1)
        .map((video: any) => {
          return new Song({
            url: video.url,
            title: video.title!,
            duration: video.durationInSec || 0
          });
        });

      return new Playlist({
        data: songs,
        title: playlistInfo.title || "Playlist sin título"
      });

    } catch (error) {
      console.error("Error obteniendo playlist:", error);
      return null;
    }
  }

  // Propiedad de compatibilidad para mantener la estructura vieja
  public get videos(): Song[] {
    return this.data;
  }
}