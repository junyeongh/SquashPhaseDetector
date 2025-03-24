import { useState, useEffect } from 'react';
import { fetchRootMessage } from './services/api';
import './App.css';

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getApiMessage = async () => {
      try {
        setLoading(true);
        const data = await fetchRootMessage();
        setMessage(data.message);
        setError(null);
      } catch (err) {
        setError('Failed to connect to the API server. Please ensure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getApiMessage();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Squash Game Phase Detector</h1>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading message from backend...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 bg-red-100 text-red-700 px-4 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <div className="text-center py-4 bg-green-100 text-green-700 px-4 rounded">
            <p className="text-lg font-medium">Backend message: "{message}"</p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>This component demonstrates communication with the FastAPI backend</p>
        </div>
      </div>
    </div>
  );
}

export default App;