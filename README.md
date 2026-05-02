![Node build](https://github.com/WieserchGT/BetaGamers/actions/workflows/node.yml/badge.svg)
![Docker build](https://github.com/WieserchGT/BetaGamers/actions/workflows/docker.yml/badge.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

![logo](https://github.com/WieserchGT/BetaGamers/blob/main/betagaming.jpg?raw=true)

# BetaGaming (Discord Music Bot)

> BetaGaming is a Discord Music Bot built by **Cristian Arciniega** with collaboration from **EvoBot**, using TypeScript, discord.js & Command Handler from [discordjs.guide](https://discordjs.guide)

## Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**  
   1.1. Enable 'Message Content Intent' in Discord Developer Portal
2. Node.js 16.11.0 or newer

## Getting Started

```sh
git clone https://github.com/WieserchGT/BetaGamers.git
cd BetaGamers
npm install
cp .env.example .env
```

Edit `.env` and set at least `TOKEN`.

Run in development:

```sh
npm run start
```

Run in production:

```sh
npm run prod
```

HiddenCloud notes:
- Main file can be `index.js`.
- The project reads configuration from `.env`.
- Recommended timezone for Queretaro, Mexico: `America/Mexico_City`.

Note: Never commit or share your token or api keys publicly.

## Features and Commands
Play music from YouTube via url

/play https://www.youtube.com/watch?v=GLvohMXgcBo

🔎 Play music from YouTube via search query

/play under the bridge red hot chili peppers

🔎 Search and select music to play

/search Pearl Jam

📃 Play youtube playlists via url

/playlist https://www.youtube.com/watch?v=YlUKcNNmywk&list=PL5RNCwK3GIO13SR_o57bGJCEmqFAwq82c

🔎 Play youtube playlists via search query

/playlist linkin park meteora

Now Playing (/nowplaying)

Queue system (/queue)

Loop / Repeat (/loop)

Shuffle (/shuffle)

Volume control (/volume)

Lyrics (/lyrics)

Pause (/pause)

Resume (/resume)

Skip (/skip)

Skip to song # in queue (/skipto)

Move a song in the queue (/move)

Remove song # from queue (/remove)

Show ping to Discord API (/ping)

Show bot uptime (/uptime)

Toggle pruning of bot messages (/pruning)

Help (/help)

Command Handler from discordjs.guide

Media Controls via Buttons

https://i.imgur.com/67TGY0c.png

🌎 Locales
Currently available locales are:

English (en)

Arabic (ar)

Brazilian Portuguese (pt_br)

Bulgarian (bg)

Romanian (ro)

Czech (cs)

Dutch (nl)

French (fr)

German (de)

Greek (el)

Indonesian (id)

Italian (it)

Japanese (ja)

Korean (ko)

Persian (fa)

Polish (pl)

Russian (ru)

Simplified Chinese (zh_cn)

Spanish (es)

Swedish (sv)

Traditional Chinese (zh_tw)

Thai (th)

Turkish (tr)

Ukrainian (uk)

Vietnamese (vi)

🤝 Contributing
Fork the repository

Clone your fork: git clone https://github.com/your-username/BetaGamers.git

Create your feature branch: git checkout -b my-new-feature

Stage changes git add .

Commit your changes: cz OR npm run commit do not use git commit

Push to the branch: git push origin my-new-feature

Submit a pull request

Developed by Cristian Arciniega
Collaboration: EvoBot
Repository: https://github.com/WieserchGT/BetaGamers
