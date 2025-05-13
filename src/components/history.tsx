import { useEffect, useState } from "react";
import { GameHistory } from "../data/heardles";



export function Historical({ history }: { history: GameHistory[] }) {
  return (
    <div className="history">
      <h2>Previous Games</h2>
      {history.map((game) => (
        <div key={game.date} className="game">
          <h3>{game.heardleId}</h3>
          <p>{game.date}</p>
          <p>{game.game.guesses.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}