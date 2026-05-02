import type { VoiceConnection } from "@discordjs/voice";
import type { CommandInteraction, TextChannel } from "discord.js";

export interface QueueOptions {
  interaction: CommandInteraction;
  textChannel: TextChannel;
  connection: VoiceConnection;
}
