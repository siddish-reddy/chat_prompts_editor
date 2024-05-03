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


function loadKeyFromLocalStorage() {
  const storedKey = localStorage.getItem('openai-key');
  if (storedKey) {
    return storedKey;
  } else {
    // If no data is stored in localStorage, return the initial static data
    return 'OpenAI API key';
  }
}

function loadAnthropicKeyFromLocalStorage() {
  const storedKey = localStorage.getItem('anthropic-key');
  if (storedKey) {
    return storedKey;
  } else {
    // If no data is stored in localStorage, return the initial static data
    return 'Anthropic API key';
  }
}

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
        // put select and text area horizontally side by side
        <div key={item.id} className="mb-6 flex flex-row h-full">
          <select
            value={item.role}
            onChange={(e) => handleRoleChange(index, e.target.value)}
            className="border text-justify border-gray-300 rounded shadow-md p-2 w-30 mr-2.5 h-fit"
          >
            <option value="system">system</option>
            <option value="assistant">assistant</option>
            <option value="user">user</option>
          </select>
          <textarea
            value={item.content}
            onChange={(e) => handleContentChange(index, e.target.value)}
            className="turn-content w-full h-full border border-gray-300 rounded shadow-sm p-2"
            // TODO: increase the height of the textarea as the user types more content
          />
        </div>
      ))}
    </div>
  );
}

function App() {
  const [data, setData] = useState(loadDataFromLocalStorage());

  const [isCopied, setIsCopied] = useState(false);

  const [openAIKey, setOpenAIKey] = useState(loadKeyFromLocalStorage());
  const [anthropicKey, setAnthropicKey] = useState(loadAnthropicKeyFromLocalStorage());

  const [model, setModel] = useState('gpt-3.5-turbo');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('savedData', JSON.stringify(data));

    // increase the height of the textarea as the user types more content

    const textareas = document.querySelectorAll('textarea.turn-content');
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });

  }, [data]);

  useEffect(() => {
    localStorage.setItem('openai-key', openAIKey);
  }, [openAIKey]);

  useEffect(() => {
    localStorage.setItem('anthropic-key', anthropicKey);
  }, [anthropicKey]);


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

  const handleCopy = () => {
    const dataWithoutId = data.map(({ id, ...rest }) => rest);
    // remove if content is empty
    const dataWithoutEmptyContent = dataWithoutId.filter(({ content }) => content !== '');
    const json = JSON.stringify(dataWithoutEmptyContent, null, 2);
    copyToClipboard(json);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };
  
  const handleGenerate = async () => {
    if (openAIKey === 'OpenAI API key') {
      alert('You need to enter your OpenAI API key first.');
      return;
    }
    if (anthropicKey === 'Anthropic API key') {
      alert('You need to enter your Anthropic API key first.');
      return;
    }
    setLoading(true);
    try {
      const dataWithoutId = data.map(({ id, ...rest }) => rest);
      // remove if content is empty
      const dataWithoutEmptyContent = dataWithoutId.filter(({ content }) => content !== '');
      console.log(model);

      if (model.includes('claude')) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${anthropicKey}`,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model:model,
            messages: dataWithoutEmptyContent,
          }),
        });
        const response_json = await response.json();
        const { messages } = response_json;
        const generatedText = messages[0].content;

        const newItem = {
          id: (data.length + 1).toString(),
          role: 'assistant',
          content: generatedText,
        };
        setData([...data, newItem]);
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model:model,
            messages: dataWithoutEmptyContent,
          }),
        });
        const response_json = await response.json();
        const { choices } = response_json;
        const generatedText = choices[0].message.content;

        const newItem = {
          id: (data.length + 1).toString(),
          role: 'assistant',
          content: generatedText,
        };
        setData([...data, newItem]);
      }

      

    } catch (error) {
      console.error(error);
      alert('Failed to generate data. Please make sure you have entered a valid OpenAI API key.');
    }
    setLoading(false);
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
    <div className="App min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-6">Chat Prompts Playground</h1>
        <div className="mb-4 flex items-center">
          <button
            className="bg-yellow-500 text-white font-bold px-6 py-2 rounded shadow"
            onClick={handlePaste}
          >
            Paste from clipboard
          </button>
          <textarea
            value={openAIKey}
            onChange={(e) => setOpenAIKey(e.target.value)}
            className="border border-gray-300 rounded shadow-sm min-h-[auto] ml-6 p-2  h-10 resize-none"
            // style={{ width: '500px' }}
            rows="1"
          />
          <textarea
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            className="border border-gray-300 rounded shadow-sm min-h-[auto] ml-6 p-2  h-10 resize-none"
            // style={{ width: '500px' }}
            rows="1"
          />
          <select
            value={model}
            onChange={(e) => setModel( e.target.value)}
            className="border text-justify border-gray-300 rounded shadow-md p-2 w-30 mr-2.5 h-fit"
          >
            <option value="gpt-3.5-turbo">GPT 3.5</option>
            <option value="gpt-4-turbo-preview">GPT 4</option>
            <option value="gpt-4-32k">GPT 4 32k</option>
            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          </select>
        </div>

        <Form data={data} onDataChange={setData} />
        <button
            className="text-white font-bold px-6 py-2 rounded shadow mr-2 bg-blue-500"
            onClick={handleGenerate}
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Generate"
            )}
          </button>
        <button
          className="text-white font-bold px-6 py-2 rounded shadow mr-2 bg-gray-400"
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
