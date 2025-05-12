import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { songs, Song } from './data/songs';

function App() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [audio] = useState(new Audio());
  const [playbackStage, setPlaybackStage] = useState(0);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playbackDurations = [1, 2, 5, 10, 15];
  const MAX_WRONG_GUESSES = 5;

  const playSong = () => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      
      // Stop after the current stage's duration
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }, playbackDurations[playbackStage] * 1000);
    }
  };

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
  };

  const nextSong = () => {
    const randomIndex = Math.floor(Math.random() * songs.length);
    setCurrentSong(songs[randomIndex]);
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
      const filtered = songs.filter(song => 
        song.title.toLowerCase().includes(value.toLowerCase()) ||
        song.artist.toLowerCase().includes(value.toLowerCase())
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

  useEffect(() => {
    nextSong();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Heardlegen</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl">Score: {score}</span>
            <div className="flex gap-2">
              <button
                onClick={playSong}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
                disabled={revealed}
              >
                Play Song ({playbackDurations[playbackStage]}s)
              </button>
              <button
                onClick={handleSkip}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                disabled={revealed || playbackStage >= playbackDurations.length - 1}
              >
                Add Time
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {wrongGuesses.map((wrongGuess, index) => (
                <div key={index} className="bg-red-900 px-3 py-1 rounded-full flex items-center gap-1">
                  <span>{wrongGuess}</span>
                  <span className="text-red-400">×</span>
                </div>
              ))}
            </div>
            {wrongGuesses.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Wrong guesses: {wrongGuesses.length}/{MAX_WRONG_GUESSES}
              </p>
            )}
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
              <div className="absolute w-full bg-gray-700 rounded mt-1 z-10">
                {suggestions.map((song, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => selectSuggestion(song)}
                  >
                    {song.title} - {song.artist}
                  </div>
                ))}
              </div>
            )}
            <button
              type="submit"
              className="w-full mt-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
              disabled={revealed}
            >
              Guess
            </button>
          </form>

          {revealed && currentSong && (
            <div className="text-center">
              <p className="text-xl mb-2">Correct answer: {currentSong.title}</p>
              <p className="text-gray-400 mb-4">by {currentSong.artist}</p>
              <button
                onClick={nextSong}
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded"
              >
                Next Song
              </button>
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default App; 