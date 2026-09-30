import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function FactInputScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { room, player } = location.state || {};
  const [fact1, setFact1] = useState('');
  const [fact2, setFact2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const checkIfAllReady = async () => {
    // Get total players in room
    const { count: playersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id);
      
    // Get total facts submitted in room
    const { count: factsCount } = await supabase
      .from('facts')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id);
      
    // If all players submitted facts, navigate to game
    if (factsCount > 0 && playersCount > 0 && factsCount >= playersCount) {
      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', room.id);
        
      // Navigate to game screen with room and player state
      navigate('/game', { state: { room, player } });
    }
  };

  useEffect(() => {
    if (!room?.id) return;
    
    const subscription = supabase
      .channel(`room-${room.id}-facts`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'facts',
        filter: `room_id=eq.${room.id}`
      }, checkIfAllReady)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [room?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Save facts to Supabase
    const { error } = await supabase
      .from('facts')
      .insert([
        {
          room_id: room.id,
          player_id: player.id,
          fact1: fact1,
          fact2: fact2
        }
      ]);
    
    if (error) {
      console.error('Error saving facts:', error);
      return;
    }
    
    setSubmitted(true);
    await checkIfAllReady();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-white/20 text-white">
        <h1 className="text-2xl font-bold mb-2 text-center">Your Secret Facts</h1>
        <p className="text-gray-200 mb-6 text-center text-sm">
          Write two interesting facts about yourself, and others will try to guess who it is.
        </p>

        <div className="mb-4">
          <label className="block text-xs text-gray-300 mb-1 font-medium">Fact #1</label>
          <textarea
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-transparent"
            rows="2"
            placeholder="Enter first fact..."
            value={fact1}
            onChange={(e) => setFact1(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-300 mb-1 font-medium">Fact #2</label>
          <textarea
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-transparent"
            rows="2"
            placeholder="Enter second fact..."
            value={fact2}
            onChange={(e) => setFact2(e.target.value)}
          />
        </div>

        {submitted ? (
          <div className="text-center py-3 bg-blue-500/50 rounded-lg font-semibold shadow-lg">
            Waiting for other players...
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors shadow-lg"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}