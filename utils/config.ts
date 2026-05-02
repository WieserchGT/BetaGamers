import "dotenv/config";
import { Config } from "../interfaces/Config";

const config: Config = {
  TOKEN: process.env.TOKEN || "",
  MAX_PLAYLIST_SIZE: parseInt(process.env.MAX_PLAYLIST_SIZE || "10", 10),
  PRUNING: process.env.PRUNING === "true",
  STAY_TIME: parseInt(process.env.STAY_TIME || "30", 10),
  DEFAULT_VOLUME: parseInt(process.env.DEFAULT_VOLUME || "100", 10),
  LOCALE: process.env.LOCALE || "en"
};

export { config };
