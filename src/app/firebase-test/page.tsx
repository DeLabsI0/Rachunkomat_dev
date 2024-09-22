'use client';

import { useState, useEffect } from 'react';

export default function FirebaseTest() {
  const [inputData, setInputData] = useState('');
  const [savedData, setSavedData] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/firebase-test');
      const data = await response.json();
      if (response.ok) {
        setSavedData(data);
      } else {
        setMessage(`Failed to fetch data: ${data.error}, ${data.details}`);
      }
    } catch (error) {
      setMessage(`Error fetching data: ${error.message}`);
    }
  };

  const handleSave = async () => {
    try {
      let jsonData;
      try {
        jsonData = JSON.parse(inputData);
      } catch {
        setMessage('Invalid JSON');
        return;
      }

      const response = await fetch('/api/firebase-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: jsonData }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(`Data saved successfully. ID: ${result.id}`);
        setInputData('');
        fetchData();
      } else {
        setMessage(`Failed to save data: ${result.error}, ${result.details}`);
      }
    } catch (error) {
      setMessage(`Error saving data: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      <div className="mb-4">
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Enter JSON data"
          className="w-full p-2 border rounded"
          rows={5}
        />
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Save to Firebase
      </button>
      {message && <p className="mb-4 text-red-500">{message}</p>}
      <h2 className="text-xl font-bold mb-2">Saved Data:</h2>
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
        {JSON.stringify(savedData, null, 2)}
      </pre>
    </div>
  );
}