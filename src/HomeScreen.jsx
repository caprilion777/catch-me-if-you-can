import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function HomeScreen({ playerName, setPlayerName }) {
  const [joinCode, setJoinCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const navigate = useNavigate();

  const handleJoinClick = () => {
    setShowCodeInput(true);
  };

  const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleCreateRoom = async () => {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ code, status: 'waiting' }])
      .select();

    if (!error) {
      const { data: playerData, error: playerError } = await supabase.from('players').insert([{ name: playerName, room_id: data[0].id, is_host: true, score: 0 }]).select();
      console.log('Player created:', playerData, playerError);
      navigate('/lobby', { state: { room: data[0], player: playerData ? playerData[0] : null } });
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName || !joinCode) {
      alert('Please enter both your name and room code');
      return;
    }

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', joinCode)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{
          room_id: roomData.id,
          name: playerName,
          is_host: false,
          score: 0
        }])
        .select();

      if (playerError) throw playerError;

      navigate('/lobby', {
        state: {
          room: roomData,
          player: playerData[0]
        }
      });
    } catch (error) {
      console.error('Join room error:', error);
      alert('Failed to join room: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Catch Me If You Can</h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleCreateRoom}
            className="w-full bg-blue-500/90 text-white py-2 px-4 rounded-lg hover:bg-blue-600/90 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Create Room
          </button>

          <button
            onClick={handleJoinClick}
            className="w-full bg-purple-500/90 text-white py-2 px-4 rounded-lg hover:bg-purple-600/90 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Join with Code
          </button>

          {showCodeInput && (
            <div className="space-y-4 transition-all duration-300 ease-in-out">
              <input
                type="text"
                placeholder="Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-green-500/90 text-white py-2 px-4 rounded-lg hover:bg-green-600/90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Confirm Join
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
