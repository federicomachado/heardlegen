import { Song } from './songs';

export interface SoundtrackConfig {
  id: string;
  title: string;
  subtitle: string;
  songs: Song[];
  audioFolder: string;
}

export interface HeardleConfig {
  id: string;
  title: string;
  subtitle: string;
  type: 'game' | 'soundtrack';
}

// Import all song files
import { songs } from './ro_songs';
export const roSongs = songs;
import { ds1Songs } from './ds1_songs';
import { ds3Songs } from './ds3_songs';
import { erSongs } from './er_songs';

// Función auxiliar para combinar canciones y asignar nuevos IDs
const combineSongs = (songArrays: Song[][]): Song[] => {
  let id = 1;
  return songArrays.flat().map(song => ({
    ...song,
    id: id++
  }));
};

export const games: HeardleConfig[] = [
  {
    id: 'ro',
    title: 'Ragnarok Heardle',
    subtitle: 'By Lazerth',
    type: 'game'
  },
  {
    id: 'fromsoft',
    title: 'FromSoftware Games',
    subtitle: 'Souls Series & Elden Ring',
    type: 'game'
  }
];

export const soundtracks: SoundtrackConfig[] = [
  {
    id: 'ds1',
    title: 'Dark Souls I',
    subtitle: 'By Drumsetto',
    songs: ds1Songs,
    audioFolder: '/DSI2/'
  },
 /*  {
    id: 'ds3',
    title: 'Dark Souls III',
    subtitle: 'The Fire Fades Edition',
    songs: ds3Songs,
    audioFolder: '/DS3/'
  },
  {
    id: 'er',
    title: 'Elden Ring',
    subtitle: 'The Lands Between',
    songs: erSongs,
    audioFolder: '/ER/'
  } */
];

// Función para obtener las canciones combinadas según las selecciones
export const getCombinedSongs = (selectedSoundtracks: string[]): Song[] => {
  const selectedSongs = selectedSoundtracks.map(id =>
    soundtracks.find(s => s.id === id)?.songs || []
  );
  return combineSongs(selectedSongs);
};