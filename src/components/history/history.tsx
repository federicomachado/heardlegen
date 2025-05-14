import {
  GameHistory,
  games
} from "../../data/heardles";
import { formatDate } from "../../utils/date";
import "./history.css";


export function Historical({ history = [] }: { history: GameHistory[] }) {

  const getHeardles = (id: string): string => {
    const config = games.find((heardle) => heardle.id === id);
    console.assert(config, `Heardle config not found for id: ${id}`);
    return config!.title;
  }


  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
      <h2>Previous Games</h2>
      {history.map((state) => (
        <div key={state.date} className="bg-gray-700 m-2 rounded-lg px-2 py-1 game">
          <div className="flex flex-row justify-between items-center">
            <h3 className={state.win? "text-green-500": "text-red-500"}><b>{getHeardles(state.heardle)}</b></h3><p><b>{formatDate(state.date)}</b></p></div>
          <div>
            <div><b>Answer:</b> {state.game.currentSong.title}</div>
            <div>Guesses:</div>
            <ol className="px-3">
              {state.game.guesses.map((guess, index) => (
                <li key={index} className="guess">
                  {index + 1}: {guess}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
}