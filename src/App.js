import React, { useState, useCallback, useEffect } from 'react';

import './App.css';

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function loadDataFromLocalStorage() {
  const storedData = localStorage.getItem('savedData');
  if (storedData) {
    return JSON.parse(storedData);
  } else {
    // If no data is stored in localStorage, return the initial static data
    return [
      {
        id: '1',
        role: 'system',
        content: 'You are <xyz> expert. You do this:\n\nYou don\'t do this:\n\nYou think step by step and you are very careful.',
      },
      {
        id: '2',
        role: 'user',
        content: 'some text',
      },
      {
        id: '3',
        role: 'assistant',
        content: 'now its assistants time think/say/take actions',
      },
    ];
  }
}

function App() {
  const [data, setData] = useState(loadDataFromLocalStorage());

  const [isCopied, setIsCopied] = useState(false);


  useEffect(() => {
    localStorage.setItem('savedData', JSON.stringify(data));
  }, [data]);


  const handleAddNewTurn = () => {
    const lastRole = data[data.length - 1]?.role || 'system';
    const newRole = lastRole === 'assistant' ? 'user' : 'assistant';

    const newItem = {
      id: (data.length + 1).toString(),
      role: newRole,
      content: '',
    };

    setData([...data, newItem]);
  };


  function Form({ data, onDataChange }) {
    const handleRoleChange = useCallback((index, newRole) => {
      onDataChange(data.map((d, i) => (i === index ? { ...d, role: newRole } : d)));
    }, [data, onDataChange]);
  
    const handleContentChange = useCallback((index, newContent) => {
      onDataChange(
        data.map((d, i) =>
          i === index ? { ...d, content: newContent } : d
        )
      );
    }, [data, onDataChange]);
  
    return (
      <div>
        {data.map((item, index) => (
          <div key={item.id} className="mb-6">
            <label className="block mb-1">Role:</label>
            <select
              value={item.role}
              onChange={(e) => handleRoleChange(index, e.target.value)}
              className="border border-gray-300 rounded shadow-md p-2 w-full"
            >
              <option value="system">system</option>
              <option value="assistant">assistant</option>
              <option value="user">user</option>
            </select>
            <label className="block mt-4 mb-1">Content:</label>
            <textarea
              value={item.content}
              onChange={(e) => handleContentChange(index, e.target.value)}
              className="w-full h-20 border border-gray-300 rounded shadow-md p-2"
            />
          </div>
        ))}
      </div>
    );
  }

  const handleCopy = () => {
    const dataWithoutId = data.map(({ id, ...rest }) => rest);
    const json = JSON.stringify(dataWithoutId, null, 2);
    copyToClipboard(json);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };
  
  const handlePaste = async () => {
    try {
      const clipboardContent = await navigator.clipboard.readText();
      const parsedData = JSON.parse(clipboardContent);
  
      // Perform additional validation checks if necessary (e.g., checking if the pasted data has the required 'role' and 'content' fields).
  
      // Loop through the parsedData and assign a unique id to each object
      const dataWithIds = parsedData.map((item, index) => {
        return { ...item, id: (index + 1).toString() };
      });
  
      setData(dataWithIds);
    } catch (error) {
      console.error(error);
      alert('Failed to paste data from clipboard. Please make sure the copied data is a valid JSON.');
    }
  };

  return (
    <div className="App min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-6">Interface</h1>
        
        <div className="mb-4">
          <button
            className="bg-yellow-500 text-white font-bold px-6 py-2 rounded shadow"
            onClick={handlePaste}
          >
            Paste
          </button>
        </div>

        <Form data={data} onDataChange={setData} />
        <button
          className="bg-blue-500 text-white font-bold px-6 py-2 rounded shadow mr-2"
          onClick={handleAddNewTurn}
        >
          + Add New Turn
        </button>
        <button
            className="bg-green-500 text-white font-bold px-6 py-2 rounded shadow mr-2"
          onClick={handleCopy}
        >
          Copy
        </button>
        {isCopied && (
          <span className="ml-2 inline-block bg-green-500 text-white px-4 py-2 rounded shadow">
            Copied to clipboard!
          </span>
        )}
        
      </div>
    </div>
  );
}
export default App;
