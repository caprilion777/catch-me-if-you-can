import { useState } from 'react';

export default function GuessingScreen({ facts, onNext, scores, setScores }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const players = ['Andrei', 'Nina', 'Valentin'];
  
  const factsArray = Array.isArray(facts)
    ? facts
    : facts ? Object.values(facts) : [];
  
  const currentFact = factsArray.length > currentFactIndex
    ? factsArray[currentFactIndex]
    : "No facts provided";

  const handleVote = (player) => {
    setSelectedPlayer(player);
    console.log("Guessed player:", player);
  };

  const handleNext = () => {
    if (factsArray.length > currentFactIndex + 1) {
      // Check if guess is correct
      const correctPlayer = players[currentFactIndex % players.length];
      if (selectedPlayer === correctPlayer) {
        setScores(prevScores => ({
          ...prevScores,
          [selectedPlayer]: prevScores[selectedPlayer] + 1
        }));
      }
      
      setCurrentFactIndex(currentFactIndex + 1);
      setSelectedPlayer(null);
    } else {
      console.log("Proceeding to results with selection:", selectedPlayer);
      if (onNext) onNext();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-white/20 text-white">
        <h1 className="text-2xl font-bold mb-4 text-center">Guess the Author!</h1>
        
        <div className="bg-white/20 p-4 rounded-xl mb-6 text-center italic text-lg border border-white/10">
          "{currentFact}"
        </div>
        
        <p className="text-gray-200 mb-4 text-sm text-center">Whose fact is this?</p>
        
        <div className="space-y-3 mb-6">
          {players.map((player) => (
            <button
              key={player}
              onClick={() => handleVote(player)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors border ${
                selectedPlayer === player
                  ? 'bg-green-500 border-green-400 text-white shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              {player}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNext}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors shadow-lg"
          disabled={!selectedPlayer}
        >
          {factsArray.length > currentFactIndex + 1 ? "Next Fact" : "Confirm Guess"}
        </button>
      </div>
    </div>
  );
}