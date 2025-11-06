'use client';

import { useState } from 'react';

export default function Home() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'process' | 'transcribe'>('process');

  // Process endpoint test
  const testProcessEndpoint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testData = {
        feature: 'explain',
        query: 'Explain quantum computing in simple terms',
        pageInfo: {
          title: 'Quantum Physics Page',
          url: 'https://example.com/quantum',
          selectedText: 'Quantum computing uses quantum bits or qubits'
        }
      };

      console.log('🚀 Sending process request:', testData);

      const res = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      console.log('✅ Process response:', data);
      setResponse(data);
    } catch (err: any) {
      console.error('❌ Process error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Transcribe endpoint test with mock audio
  const testTranscribeEndpoint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a small mock audio file for testing
      const mockAudioBuffer = new ArrayBuffer(1024); // 1KB mock audio
      const mockBlob = new Blob([mockAudioBuffer], { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('audio', mockBlob, 'test-audio.wav');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');

      console.log('🎵 Sending transcribe request with mock audio');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      console.log('✅ Transcribe response:', data);
      setResponse(data);
    } catch (err: any) {
      console.error('❌ Transcribe error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test with base64 audio (alternative method)
  const testTranscribeBase64 = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a mock base64 audio string (just a small placeholder)
      const mockBase64Audio = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0iBzJ+z/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0iBzJ+z/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0iBzJ+z/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0iBzJ+z==';

      const testData = {
        audio: mockBase64Audio,
        mimeType: 'audio/wav',
        model: 'whisper-large-v3-turbo',
        language: 'en'
      };

      console.log('🎵 Sending transcribe request with base64 audio');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      console.log('✅ Transcribe response:', data);
      setResponse(data);
    } catch (err: any) {
      console.error('❌ Transcribe error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant API Tester</h1>
        <p className="text-gray-600 mb-8">Test your backend endpoints with this interface</p>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => { setActiveTab('process'); clearResults(); }}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'process'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Test Process Endpoint
          </button>
          <button
            onClick={() => { setActiveTab('transcribe'); clearResults(); }}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'transcribe'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Test Transcribe Endpoint
          </button>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'process' ? 'Process Endpoint Test' : 'Transcribe Endpoint Test'}
          </h2>
          
          {activeTab === 'process' && (
            <div>
              <p className="text-gray-600 mb-4">
                This will test the <code>/api/process</code> endpoint with a sample explanation request.
              </p>
              <button
                onClick={testProcessEndpoint}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
              >
                {loading ? 'Testing...' : 'Test Process Endpoint'}
              </button>
            </div>
          )}

          {activeTab === 'transcribe' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                This will test the <code>/api/transcribe</code> endpoint with mock audio data.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={testTranscribeEndpoint}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {loading ? 'Testing...' : 'Test with FormData'}
                </button>
                <button
                  onClick={testTranscribeBase64}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {loading ? 'Testing...' : 'Test with Base64'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-blue-800 font-medium">Testing endpoint... Check browser console for details</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-white font-semibold mb-4 text-lg">API Response</h3>
            <div className="bg-black rounded-lg p-4 overflow-auto">
              <pre className="text-green-400 text-sm">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
            
            {/* Process-specific response display */}
            {response.response && (
              <div className="mt-6 bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Processed Response:</h4>
                <div className="prose max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap">{response.response}</p>
                </div>
                {response.usage && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Model: {response.model}</p>
                    <p>Tokens: {response.usage.total_tokens} (Prompt: {response.usage.prompt_tokens}, Completion: {response.usage.completion_tokens})</p>
                  </div>
                )}
              </div>
            )}

            {/* Transcribe-specific response display */}
            {response.transcription && (
              <div className="mt-6 bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Transcription Result:</h4>
                <p className="text-gray-800">{response.transcription}</p>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Model: {response.model}</p>
                  <p>Language: {response.language}</p>
                  <p>Success: {response.success ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">API Endpoints</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">POST /api/process</h4>
              <p className="text-gray-600 text-sm mb-2">Process AI requests for explanation, summarization, etc.</p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                {`{
  "feature": "explain|summarize|extract|search|ask|reply",
  "query": "your question or request",
  "pageInfo": {
    "title": "page title",
    "url": "page url", 
    "selectedText": "selected text"
  }
}`}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">POST /api/transcribe</h4>
              <p className="text-gray-600 text-sm mb-2">Transcribe audio files to text</p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                {`// FormData:
audio: File/Blob
model: string
language: string

// OR JSON:
{
  "audio": "base64string",
  "mimeType": "audio/wav",
  "model": "whisper-large-v3-turbo"
}`}
              </div>
            </div>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Debugging Tips</h4>
          <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
            <li>Open browser Developer Tools (F12) and check the Console tab</li>
            <li>All API requests and responses are logged to the console</li>
            <li>Check the Network tab to see the actual HTTP requests</li>
            <li>Look for any CORS errors in the console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}