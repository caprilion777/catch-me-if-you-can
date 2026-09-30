import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';


export default function GameScreen() {
  const location = useLocation();
  const { room, player } = location.state || {};
  const [facts, setFacts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [shuffledFacts, setShuffledFacts] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [allRoomGuesses, setAllRoomGuesses] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!room?.id) return;
      const { data: playersData } = await supabase.from('players').select('*').eq('room_id', room.id);
      if (playersData) setPlayers(playersData);
      
      const { data: factsData } = await supabase.from('facts').select('*').eq('room_id', room.id);
      if (factsData) {
        setFacts(factsData);
        const allFacts = [];
        factsData.forEach(row => {
          if (row.fact1) allFacts.push({ text: row.fact1, authorId: row.player_id });
          if (row.fact2) allFacts.push({ text: row.fact2, authorId: row.player_id });
        });
        for (let i = allFacts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allFacts[i], allFacts[j]] = [allFacts[j], allFacts[i]];
        }
        setShuffledFacts(allFacts);
      }
    };
    fetchData();
  }, [room]);

  useEffect(() => {
    if (!room || !player) {
      // Handle missing state
      return;
    }
    // TODO: Fetch and shuffle facts
  }, [room, player]);

  const handleGuess = async (guessedPlayerId) => {
    const currentFact = shuffledFacts[currentFactIndex];
    
    // Insert guess into Supabase
    const { error } = await supabase.from('guesses').insert({
      room_id: room.id,
      player_id: player.id,
      fact_text: currentFact.text,
      guessed_player_id: guessedPlayerId,
      actual_author_id: currentFact.authorId
    });

    if (error) {
      console.error('Error saving guess:', error);
      return;
    }

    // Record the guess locally
    setGuesses(prev => [...prev, {
      factText: currentFact.text,
      guessedPlayerId: guessedPlayerId,
      actualAuthorId: currentFact.authorId
    }]);

    // Check if this is the final fact
    if (currentFactIndex === shuffledFacts.length - 1) {
      // Set waiting state immediately for final fact
      setIsWaiting(true);
      
      // Start polling to check if all players have guessed
      const checkAllGuesses = async () => {
        const { count: totalGuesses } = await supabase
          .from('guesses')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .eq('fact_text', currentFact.text);

        const allPlayersGuessed = totalGuesses >= players.length;

        if (allPlayersGuessed) {
          // All players have guessed - proceed to game over
          setIsWaiting(false);
          
          // Fetch all guesses for the room
          const { data: allGuessesData } = await supabase
            .from('guesses')
            .select('*')
            .eq('room_id', room.id);
          
          if (allGuessesData) {
            setAllRoomGuesses(allGuessesData);
          }
          setIsGameOver(true);
        } else {
          // Not all players have guessed yet - check again in 2 seconds
          setTimeout(checkAllGuesses, 2000);
        }
      };
      
      // Start the polling
      checkAllGuesses();
    } else {
      // Move to next fact immediately
      setCurrentFactIndex(prev => prev + 1);
    }
  };

  if (isWaiting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-white/20 text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Waiting for other players...</h1>
          <p className="text-lg">Please wait while all players submit their guesses</p>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const calculateScores = (allGuesses, players) => {
    const playerScores = {};
    players.forEach(p => playerScores[p.id] = 0);
    
    allGuesses.forEach(guess => {
      if (guess.guessed_player_id === guess.actual_author_id) {
        playerScores[guess.player_id] = (playerScores[guess.player_id] || 0) + 1;
      }
    });
    
    // Sort players by score and include score in result
    return [...players]
      .sort((a, b) => playerScores[b.id] - playerScores[a.id])
      .map(p => ({
        ...p,
        score: playerScores[p.id]
      }));
  };

  if (isGameOver) {
    const sortedPlayers = calculateScores(allRoomGuesses, players);
    
    const score = guesses.filter(g => g.guessedPlayerId === g.actualAuthorId).length;

    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-4 overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full shadow-xl border border-white/20 text-white mt-10 mb-10">
          <h1 className="text-3xl font-bold mb-2 text-center text-yellow-400">Game Over! 🏆</h1>
          <p className="text-xl text-center mb-8">You guessed {score} out of {guesses.length} correctly.</p>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index, array) => {
                // Calculate rank - players with same score share the same rank
                const rank = array.findIndex(p => p.score === player.score) + 1;
                
                // Define rank-based colors
                const rankColors = {
                  1: 'bg-gradient-to-r from-yellow-500 to-yellow-300 text-black',
                  2: 'bg-gradient-to-r from-gray-400 to-gray-300 text-black',
                  3: 'bg-gradient-to-r from-amber-700 to-amber-500 text-white',
                  default: 'bg-white/5 text-white'
                };
                
                const rankClass = rankColors[rank] || rankColors.default;
                
                return (
                  <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${rankClass}`}>
                    <div className="flex items-center">
                      <span className="text-lg font-bold w-8">
                        {rank === 1 ? '🏆' : rank}
                      </span>
                      <span className="ml-2">{player.name}</span>
                    </div>
                    <span className="font-bold">{player.score} points</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {guesses.map((g, index) => {
              const isCorrect = g.guessedPlayerId === g.actualAuthorId;
              // Find player names from the players array
              const authorName = players.find(p => p.id === g.actualAuthorId)?.name || 'Unknown';
              const guessedName = players.find(p => p.id === g.guessedPlayerId)?.name || 'Unknown';
              
              // Get all guesses for this fact from other players
              const otherGuesses = allRoomGuesses
                .filter(guess => guess.fact_text === g.factText && guess.player_id !== player.id)
                .map(guess => {
                  const guessPlayer = players.find(p => p.id === guess.player_id);
                  const guessedPlayer = players.find(p => p.id === guess.guessed_player_id);
                  return {
                    playerName: guessPlayer?.name || 'Unknown',
                    guessedName: guessedPlayer?.name || 'Unknown',
                    isCorrect: guess.guessed_player_id === guess.actual_author_id
                  };
                });

              return (
                <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                  <p className="text-lg italic mb-3">"{g.factText}"</p>
                  <p className="text-sm">
                    <span className="text-gray-300">Actual author:</span> <span className="font-bold text-white">{authorName}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-300">You guessed:</span> <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{guessedName}</span>
                  </p>
                  
                  {otherGuesses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-300 mb-2">Other players guessed:</p>
                      {otherGuesses.map((og, i) => (
                        <p key={i} className="text-xs">
                          <span className="text-gray-400">{og.playerName}:</span> <span className={`${og.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                            {og.guessedName}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-white/20 text-white">
        <h1 className="text-2xl font-bold mb-2 text-center">Game Screen</h1>
        <div className="space-y-2">
        </div>

        {shuffledFacts.length > 0 && (
          <div className="mt-8">
            <p className="text-xl font-semibold mb-4">{shuffledFacts[currentFactIndex].text}</p>
            <div className="flex flex-col gap-3 mt-8">
              {players.map((p) => (
                <button
                  key={p.id}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
                  onClick={() => {
                    handleGuess(p.id);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
