import React from 'react';

const ResultsScreen = ({ scores, onNext }) => {
  const players = Object.entries(scores).map(([name, score]) => ({ name, score }));

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Game Results</h1>
        <div className="space-y-4 mb-8">
          {players.map((player, index) => (
            <div key={index} className="flex justify-between text-white">
              <span>{player.name}</span>
              <span>{player.score} points</span>
            </div>
          ))}
        </div>
        <button
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;