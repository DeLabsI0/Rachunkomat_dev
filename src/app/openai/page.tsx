'use client';

import { useChat } from 'ai/react';

export default function OpenAIPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OpenAI Chat</h1>
      <div className="bg-gray-100 rounded-lg p-4 mb-4 h-[60vh] overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-4 ${
              m.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block p-3 rounded-lg ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-black shadow'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          className="flex-1 border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-r-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}