'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';

export default function OpenAIPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OpenAI Chat</h1>
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map(m => (
          <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          className="flex-1 border border-gray-300 rounded-l-md p-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white rounded-r-md px-4 py-2"
        >
          Send
        </button>
      </form>
    </div>
  );
}