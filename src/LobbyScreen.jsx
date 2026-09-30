import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function LobbyScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const room = state?.room;
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!room?.id) return;

    // Fetch initial players
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id);
      
      if (!error && data) setPlayers(data);
    };

    // Subscribe to new players
    const channel = supabase
      .channel('room_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          setPlayers(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    fetchPlayers();

    // Subscribe to room status changes
    const statusChannel = supabase
      .channel('room_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`
        },
        (payload) => {
          if (payload.new.status === 'entering_facts') {
            navigate('/facts', { state: { room, player: state?.player } });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [room?.id, navigate, state?.player]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/30 shadow-2xl p-6">
        <h1 className="text-4xl font-bold text-center text-white tracking-widest mb-6">
          {room?.code}
        </h1>

        <div className="space-y-3">
          {players.map((player, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-700/20 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-400' : 'bg-gray-400'} mr-3`} />
              <span className="text-gray-200">{player.name}</span>
            </div>
          ))}
        </div>

        {state?.player?.id === players[0]?.id ? (
          <button
            className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors duration-200"
            onClick={async () => {
              const { error } = await supabase
                .from('rooms')
                .update({ status: 'entering_facts' })
                .eq('id', room.id);
                
              if (!error) {
                navigate('/facts', { state: { room, player: state?.player } });
              }
            }}
          >
            Start Game
          </button>
        ) : (
          <p className="text-gray-300 animate-pulse mt-6 text-center">Waiting for the host to start...</p>
        )}
      </div>
    </div>
  );
}