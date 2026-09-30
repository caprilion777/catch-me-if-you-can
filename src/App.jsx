import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import FactInputScreen from './FactInputScreen';
import GuessingScreen from './GuessingScreen';
import ResultsScreen from './ResultsScreen';
import HomeScreen from './HomeScreen';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import { supabase } from './supabaseClient';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [facts, setFacts] = useState({ fact1: '', fact2: '' });
  const [scores, setScores] = useState({ Andrei: 0, Nina: 0, Valentin: 0 });

  console.log('Supabase init:', supabase);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <Routes>
        <Route path="/" element={
          <HomeScreen
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onJoin={(name) => setPlayerName(name)}
          />
        } />
        <Route path="/lobby" element={
          <LobbyScreen onStartGame={() => navigate('/factInput')} />
        } />
        <Route path="/factInput" element={
          <FactInputScreen
            facts={facts}
            setFacts={setFacts}
            onNext={() => navigate('/guessing')}
          />
        } />
        <Route path="/guessing" element={
          <GuessingScreen
            facts={[facts.fact1, facts.fact2].filter(Boolean)}
            onNext={() => navigate('/results')}
            scores={scores}
            setScores={setScores}
          />
        } />
        <Route path="/results" element={
          <ResultsScreen scores={scores} onNext={() => navigate('/')} />
        } />
        <Route path="/game" element={
          <GameScreen />
        } />
        <Route path="/facts" element={
          <FactInputScreen />
        } />
      </Routes>
    </div>
  );
}