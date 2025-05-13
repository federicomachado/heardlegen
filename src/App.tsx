import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { heardles, HeardleConfig, GameState, GameHistory } from './data/heardles';
import { Song } from './data/songs';
import {Historical} from './components/history/history';

function App() {
  const [currentHeardle, setCurrentHeardle] = useState<HeardleConfig>(() => {
    const savedHeardle = localStorage.getItem('currentHeardle');
    return savedHeardle ? JSON.parse(savedHeardle) : heardles[0];
  });
  const [history, setHistory] = useState<GameHistory[]>(() => {
    const history = localStorage.getItem('history');
    return history ? JSON.parse(history) : [];
  });
    const getNextSong = (selectedHeardle: HeardleConfig | undefined): Song => {
    const heardle = selectedHeardle || currentHeardle;
    const randomIndex = Math.floor(Math.random() * heardle.songs.length);
    return heardle.songs[randomIndex]
  }
  const [currentSong, setCurrentSong] = useState<Song>(()=> getNextSong(currentHeardle));
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [audio] = useState(new Audio());
  const [playbackStage, setPlaybackStage] = useState(0);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [volume, setVolume] = useState(0.5); // Default volume at 50%
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playbackDurations = [1, 2, 5, 10, 15];
  const MAX_WRONG_GUESSES = 5;

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = () => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Stop after the current stage's duration
      timeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, playbackDurations[playbackStage] * 1000);
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
        audioRef.current.play();
        // Recalculate remaining time
        const remainingTime = (playbackDurations[playbackStage] * 1000) - 
          (audioRef.current.currentTime * 1000);
        timeoutRef.current = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }, remainingTime);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getGameState = (): GameState => {
    const currentGuesses = guess ? [...wrongGuesses, guess] : wrongGuesses
    return {
      id: currentHeardle.id,
      title: currentHeardle.title,
      subtitle: currentHeardle.subtitle,
      audioFolder: currentHeardle.audioFolder,
      timeStep: currentGuesses.length,
      guesses: currentGuesses,
      currentSongSong: currentSong,
    };
  }

  const loadCurrentHeardle = (): boolean => {
    const savedHeardle = localStorage.getItem('currentGame');
    if(!savedHeardle) return false;
    const parsedHeardle: GameState = JSON.parse(savedHeardle);
    const heardle = heardles.find(h => h.id === parsedHeardle.id);
    if (!heardle) return false;
    setCurrentHeardle(heardle);
    setPlaybackStage(parsedHeardle.timeStep);
    setWrongGuesses(Array.from(parsedHeardle.guesses));
    setCurrentSong(parsedHeardle.currentSongSong);
    return true
  }

  const saveCurrentHeardle = () => {
    const gameState = getGameState();
    localStorage.setItem('currentGame', JSON.stringify(gameState));
  }
  const clearCurrentHeardle = () => {
    localStorage.removeItem('currentGame');
  }

  const addResultToHistory = (didUserWon: boolean) => {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const newEntry: GameHistory = {
      heardle: currentHeardle.id,
      game: getGameState(),
      date: new Date().toISOString(),
      win: didUserWon
    };
    history.push(newEntry);
    localStorage.setItem('history', JSON.stringify(history));
    setHistory(history)
  }

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentSong && guess.toLowerCase() === currentSong.title.toLowerCase()) {
      setScore(score + 1);
      setRevealed(true);
      addResultToHistory(true);
      clearCurrentHeardle();
    } else {
      // Wrong guess, advance to next playback stage
      setPlaybackStage(prev => Math.min(prev + 1, playbackDurations.length - 1));
      setWrongGuesses(prev => [...prev, guess]);
      
      // Check if max wrong guesses reached
      if (wrongGuesses.length + 1 >= MAX_WRONG_GUESSES) {
        setRevealed(true);
        addResultToHistory(false);
      }
      saveCurrentHeardle()
    }
    setGuess(''); // Clear the search field
    setSuggestions([]); // Clear suggestions
  };

  const resetGame = (heardle? : HeardleConfig) => {
    const selectedSong = getNextSong(heardle? heardle : currentHeardle);
    setCurrentSong(selectedSong);
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
      const filtered = currentHeardle.songs.filter(song => 
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

  const handleHeardleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedHeardle = heardles.find(h => h.id === e.target.value);
    if (selectedHeardle) {
      setCurrentHeardle(selectedHeardle);
      localStorage.setItem('currentHeardle', JSON.stringify(selectedHeardle));
      localStorage.removeItem('currentGame'); 
      // Reset game state when changing Heardle
      resetGame(selectedHeardle);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  useEffect(() => {
    if(!loadCurrentHeardle()){
      resetGame();
      saveCurrentHeardle();
    }
  }, [currentHeardle]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <select
            value={currentHeardle.id}
            onChange={handleHeardleChange}
            className="bg-gray-800 text-white px-4 py-2 rounded mb-4"
          >
            {heardles.map(heardle => (
              <option key={heardle.id} value={heardle.id}>
                {heardle.title}
              </option>
            ))}
          </select>
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">{currentHeardle.title}</h1>
          <p className="text-gray-400 text-center">{currentHeardle.subtitle}</p>
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
                <span>{playbackDurations[playbackStage]}s</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((playbackStage + 1) / playbackDurations.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {playbackDurations.map((duration, index) => (
                  <span key={index}>{duration}s</span>
                ))}
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

          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {wrongGuesses.map((guess, index) => (
                <span key={index} className="bg-red-900 text-red-200 px-2 py-1 rounded text-sm">
                  {guess}
                </span>
              ))}
            </div>
          </div>

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
                  onClick={()=>resetGame(currentHeardle)}
                  className="mt-4 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto"
                >
                  Next Song
                </button>
              </div>
            </div>
          )}
        </div>
        <Historical history={history} />
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default App; 