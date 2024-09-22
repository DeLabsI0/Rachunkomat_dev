import React from 'react';

export default function TailwindExamplePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Tailwind CSS Examples
        </h1>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Typography</h2>
          <p className="text-lg text-gray-700 mb-2">This is a large paragraph.</p>
          <p className="text-sm text-gray-600 mb-2">This is a small paragraph.</p>
          <p className="font-bold mb-2">This text is bold.</p>
          <p className="italic mb-2">This text is italic.</p>
          <p className="underline mb-2">This text is underlined.</p>
        </section>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Colors</h2>
          <div className="flex space-x-4">
            <div className="w-20 h-20 bg-red-500 rounded-md"></div>
            <div className="w-20 h-20 bg-blue-500 rounded-md"></div>
            <div className="w-20 h-20 bg-green-500 rounded-md"></div>
            <div className="w-20 h-20 bg-yellow-500 rounded-md"></div>
          </div>
        </section>

        {/* Flexbox */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Flexbox</h2>
          <div className="flex justify-between items-center bg-gray-200 p-4 rounded-lg">
            <div className="bg-blue-200 p-2 rounded">Item 1</div>
            <div className="bg-blue-300 p-2 rounded">Item 2</div>
            <div className="bg-blue-400 p-2 rounded">Item 3</div>
          </div>
        </section>

        {/* Responsive Design */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Responsive Design</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-purple-200 p-4 rounded">Column 1</div>
            <div className="bg-purple-300 p-4 rounded">Column 2</div>
            <div className="bg-purple-400 p-4 rounded">Column 3</div>
          </div>
        </section>

        {/* Hover and Focus Effects */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Hover and Focus Effects</h2>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out">
            Hover Me
          </button>
        </section>
      </div>
    </div>
  );
}