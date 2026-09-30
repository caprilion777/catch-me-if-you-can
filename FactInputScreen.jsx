import { useState } from 'react';

export default function FactInputScreen() {
  const [fact, setFact] = useState('');

  const handleSubmit = () => {
    console.log("Секретный факт:", fact);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Ваш секретный факт</h1>
        <p className="text-gray-200 mb-6 text-center text-sm">
          Напишите один интересный факт о себе, а другие попытаются угадать, чей он.
        </p>
        <textarea
          className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 border border-transparent"
          rows="4"
          placeholder="Введите ваш факт..."
          value={fact}
          onChange={(e) => setFact(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          Готово
        </button>
      </div>
    </div>
  );
}