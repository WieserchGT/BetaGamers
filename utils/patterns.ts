export const videoPattern = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/;
// ✅ Patrón mejorado: solo detecta playlists reales, no videos individuales con list=
export const playlistPattern = /^(?!.*watch\?v=.+&list=).*[?&]list=([^#\&\?]+).*/;
export const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
export const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
export const isURL =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
