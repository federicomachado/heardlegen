import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { games, soundtracks, getCombinedSongs, roSongs, HeardleConfig, SoundtrackConfig } from './data/heardles';
import { Song } from './data/songs';

function App() {
  const [selectedGame, setSelectedGame] = useState<HeardleConfig>(games[0]);
  const [selectedSoundtracks, setSelectedSoundtracks] = useState<string[]>(['ds1']);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [playbackStage, setPlaybackStage] = useState(0);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [progressTime, setProgressTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const playbackDurations = [1, 2, 5, 10, 15];
  const MAX_WRONG_GUESSES = 5;

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Progress bar update using audio events
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (!isPlaying) return;
      const currentTime = audio.currentTime - startTimeRef.current;
      setCurrentTime(currentTime);
      
      if (currentTime >= playbackDurations[playbackStage]) {
        audio.pause();
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isPlaying, playbackStage]);

  // Load random song and set random start time when game or soundtracks change
  useEffect(() => {
    if (selectedGame.id === 'ro') {
      const songs = roSongs;
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        setCurrentSong(songs[randomIndex]);
      }
    } else {
      const songs = getCombinedSongs(selectedSoundtracks);
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        setCurrentSong(songs[randomIndex]);
      }
    }
  }, [selectedGame, selectedSoundtracks]);

  // Set initial random start time when song changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      audio.src = currentSong.audioUrl;

      const handleMetadata = () => {
        const duration = audio.duration;
        const maxPlayTime = playbackDurations[playbackDurations.length - 1]; // Use maximum possible duration
        const latestPossibleStart = Math.max(0, duration - maxPlayTime);
        startTimeRef.current = Math.random() * latestPossibleStart;
        audio.removeEventListener('loadedmetadata', handleMetadata);
      };

      if (audio.readyState >= 2) {
        handleMetadata();
      } else {
        audio.addEventListener('loadedmetadata', handleMetadata);
      }
    }
  }, [currentSong]);

  const playSong = () => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current;
      
      // Reset to the stored start time
      audio.currentTime = startTimeRef.current;
      setCurrentTime(0);
      audio.volume = volume;
      
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, playbackDurations[playbackStage] * 1000);

      audio.play();
    }
  };

  const togglePause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else {
        // Recalculate remaining time
        const elapsedTime = currentTime;
        const remainingTime = (playbackDurations[playbackStage] * 1000) - (elapsedTime * 1000);
        
        timeoutRef.current = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }, remainingTime);

        audioRef.current.play();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSong && guess.toLowerCase() === currentSong.title.toLowerCase()) {
      setScore(score + 1);
      setRevealed(true);
    } else {
      // Wrong guess, advance to next playback stage
      setPlaybackStage(prev => Math.min(prev + 1, playbackDurations.length - 1));
      setWrongGuesses(prev => [...prev, guess]);
      
      // Check if max wrong guesses reached
      if (wrongGuesses.length + 1 >= MAX_WRONG_GUESSES) {
        setRevealed(true);
      }
    }
    setGuess(''); // Clear the search field
    setSuggestions([]); // Clear suggestions
  };

  const nextSong = () => {
    const songs = getCombinedSongs(selectedSoundtracks);
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      setCurrentSong(songs[randomIndex]);
    }
    setGuess('');
    setRevealed(false);
    setPlaybackStage(0);
    setWrongGuesses([]);
  };

  const handleSkip = () => {
    setPlaybackStage(prev => Math.min(prev + 1, playbackDurations.length - 1));
    setWrongGuesses(prev => [...prev, "Skip"]);
    
    // Check if max wrong guesses reached
    if (wrongGuesses.length + 1 >= MAX_WRONG_GUESSES) {
      setRevealed(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(value);
    
    if (value.length > 0) {
      const songs = getCombinedSongs(selectedSoundtracks);
      const filtered = songs.filter(song => 
        song.title.toLowerCase().includes(value.toLowerCase())        
      );
      setSuggestions(filtered.slice(0, 5)); // Show top 5 matches
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (song: Song) => {
    setGuess(song.title);
    setSuggestions([]);
  };

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const game = games.find(g => g.id === e.target.value);
    if (game) {
      setSelectedGame(game);
      // If we change to Ragnarok, clear soundtrack selections
      if (game.id === 'ro') {
        setSelectedSoundtracks([]);
      } else if (game.id === 'fromsoft' && selectedSoundtracks.length === 0) {
        // If we change to FromSoft and nothing is selected, select DS1 by default
        setSelectedSoundtracks(['ds1']);
      }
      // Reset game state
      setCurrentSong(null);
      setWrongGuesses([]);
      setGuess('');
      setSuggestions([]);
      setRevealed(false);
      setPlaybackStage(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handleSoundtrackToggle = (soundtrackId: string) => {
    setSelectedSoundtracks(prev => {
      const isSelected = prev.includes(soundtrackId);
      if (isSelected) {
        // Don't allow deselecting if it's the last selected soundtrack
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== soundtrackId);
      } else {
        return [...prev, soundtrackId];
      }
    });
  };

  useEffect(() => {
    let rafId: number;
    const animate = () => {
      if (audioRef.current && isPlaying) {
        setProgressTime(audioRef.current.currentTime - startTimeRef.current);
        rafId = requestAnimationFrame(animate);
      }
    };
    if (isPlaying) {
      rafId = requestAnimationFrame(animate);
    } else {
      setProgressTime(currentTime); // sincroniza al pausar
    }
    return () => rafId && cancelAnimationFrame(rafId);
  }, [isPlaying, currentSong, playbackStage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          {/* Game Selector */}
          <div className="w-full max-w-md mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Game
            </label>
            <select
              value={selectedGame.id}
              onChange={handleGameChange}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded"
            >
              {games.map(game => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </select>
          </div>

          {/* Soundtracks Selector - Solo mostrar si FromSoft está seleccionado */}
          {selectedGame.id === 'fromsoft' && (
            <div className="w-full max-w-md mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Soundtracks
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {soundtracks.map(soundtrack => (
                  <label
                    key={soundtrack.id}
                    className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
                      selectedSoundtracks.includes(soundtrack.id)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSoundtracks.includes(soundtrack.id)}
                      onChange={() => handleSoundtrackToggle(soundtrack.id)}
                      className="sr-only"
                    />
                    <div className="ml-2">
                      <div className="font-medium">{soundtrack.title}</div>
                      <div className="text-sm text-gray-400">{soundtrack.subtitle}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">
            {selectedGame.title} Heardle
          </h1>
          <p className="text-gray-400 text-center mb-2">
            {selectedGame.id === 'fromsoft' 
              ? selectedSoundtracks.length > 1
                ? `Mixed Mode: ${selectedSoundtracks.length} Soundtracks`
                : soundtracks.find(s => s.id === selectedSoundtracks[0])?.subtitle
              : selectedGame.subtitle
            }
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <span className="text-xl">Score: {score}</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Volume Control */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" 
                  />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-sm text-gray-400 w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={playSong}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded w-full sm:w-auto"
                  disabled={revealed || isPlaying}
                >
                  Play Song ({playbackDurations[playbackStage]}s)
                </button>
                {isPlaying && (
                  <button
                    onClick={togglePause}
                    className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded w-full sm:w-auto"
                    disabled={revealed}
                  >
                    Pause
                  </button>
                )}
                {wrongGuesses.length < 4 && (
                  <button
                    onClick={handleSkip}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded w-full sm:w-auto"
                    disabled={revealed}
                  >
                    Add Time
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mb-6 space-y-4">
            {/* Time Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Time Available</span>
                <span>{Math.min(playbackDurations[playbackStage], Number(currentTime.toFixed(1)))}s / {playbackDurations[playbackStage]}s</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transform-gpu"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, progressTime / playbackDurations[playbackStage]))})`,
                    transformOrigin: 'left'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0s</span>
                {Array.from({ length: Math.floor(playbackDurations[playbackStage]) }).map((_, index) => {
                  // Solo mostrar marcas cada segundo si la duración es corta (≤5s)
                  // o cada 2-5 segundos si la duración es más larga
                  const interval = playbackDurations[playbackStage] <= 5 ? 1 : 
                                  playbackDurations[playbackStage] <= 10 ? 2 : 5;
                  
                  if ((index + 1) % interval === 0 && index + 1 < playbackDurations[playbackStage]) {
                    return (
                      <span key={index + 1}>{index + 1}s</span>
                    );
                  }
                  return null;
                })}
                <span>{playbackDurations[playbackStage]}s</span>
              </div>
            </div>

            {/* Tries Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Tries Remaining</span>
                <span>{MAX_WRONG_GUESSES - wrongGuesses.length}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${(wrongGuesses.length / MAX_WRONG_GUESSES) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {Array.from({ length: MAX_WRONG_GUESSES }).map((_, index) => (
                  <span key={index}>Try {index + 1}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Wrong Guesses Display */}
          {wrongGuesses.length > 0 && (
            <div className="mb-6 bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Last Guesses:</h3>
              <div className="space-y-2">
                {wrongGuesses.map((guess, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">{index + 1}.</span>
                    <span className="bg-red-900/60 text-red-100 px-3 py-1.5 rounded-md text-sm font-medium flex-grow">
                      {guess}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {playbackDurations[Math.min(index, playbackDurations.length - 1)]}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleGuess} className="mb-4 relative">
            <input
              type="text"
              value={guess}
              onChange={handleInputChange}
              placeholder="Enter song title..."
              className="w-full p-2 rounded bg-gray-700 text-white"
              disabled={revealed}
            />
            {suggestions.length > 0 && (
              <div className="absolute w-full bg-gray-700 rounded mt-1 z-10 max-h-60 overflow-y-auto">
                {suggestions.map((song, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => selectSuggestion(song)}
                  >
                    {song.title}
                  </div>
                ))}
              </div>
            )}
            <button
              type="submit"
              className="w-full mt-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={revealed || !guess.trim()}
            >
              Guess
            </button>
          </form>

          {revealed && currentSong && (
            <div className="mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2">The song was:</h2>
                <p className="text-lg break-words">{currentSong.title}</p>
                <button
                  onClick={nextSong}
                  className="mt-4 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto"
                >
                  Next Song
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default App; 