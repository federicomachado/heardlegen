import { GameHistory, HeardleConfig, heardles } from "../data/heardles";



export function Historical({ history }: { history: GameHistory[] }) {

const getHeardles = (id: string): string =>{
    const config = heardles.find((heardle) => heardle.id === id);
    console.assert(config, `Heardle config not found for id: ${id}`);
    return config!.title;
}
  return (
    <div className="history">
      <h2>Previous Games</h2>
      {history.map((game) => (
        <div key={game.date} className="game">
          <h3>{getHeardles(game.heardle)}</h3>
          <p>{game.date}</p>
          <p>{game.game.guesses.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}