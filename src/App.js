import React, { useState, useCallback } from 'react';

import './App.css';

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function App() {
  const [data, setData] = useState([
    {
      "id": "1",
      "role": "system",
      "content": "some text"
    },
    {
      "id": "2",
      "role": "assistant",
      "content": "some other text"
    },
    {
      "id": "3",
      "role": "user",
      "content": "some more text\ntext continued"
    }
  ]);
  const [isCopied, setIsCopied] = useState(false);

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
          <div key={item.id} className="mb-4">
            <label className="block">Role:</label>
            <select
              value={item.role}
              onChange={(e) => handleRoleChange(index, e.target.value)}
              className="rounded border p-2"
            >
              <option value="system">system</option>
              <option value="assistant">assistant</option>
              <option value="user">user</option>
            </select>
            <label className="block mt-2">Content:</label>
            <textarea
              value={item.content}
              onChange={(e) => handleContentChange(index, e.target.value)}
              className="w-full rounded border p-2"
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
    <div className="App">
      <h1>Interface</h1>
      <Form data={data} onDataChange={setData} />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded shadow mr-2"
        onClick={handleAddNewTurn}
      >
        + Add New Turn
      </button>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded shadow"
        onClick={handleCopy}
      >
        Copy
      </button>
      {isCopied && (
        <span className="ml-2 inline-block bg-green-500 text-white px-4 py-2 rounded shadow">
          Copied to clipboard!
        </span>
      )}

      <button
        className="bg-yellow-600 text-white px-4 py-2 rounded shadow"
        onClick={handlePaste}
      >
        Load from clipboard
      </button>
    </div>
  );
}
export default App;
