"use client";

import { useState, useEffect, useRef } from "react";

export default function VoiceAssistantGemini() {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    setError(null);
    
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("നിങ്ങളുടെ ബ്രൗസർ സ്പീച്ച് റികഗ്നിഷൻ പിന്തുണയ്‌ക്കുന്നില്ല. Chrome അല്ലെങ്കിൽ Edge ഉപയോഗിക്കുക.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "ml-IN"; // Malayalam
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setQuestion(transcript);
            setTranscript("");
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error, event.message);
        setListening(false);
        setTranscript("");
        
        // Handle specific errors
        switch (event.error) {
          case "network":
            setError("നെറ്റ്‌വർക്ക് പിശക്. നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.");
            break;
          case "not-allowed":
          case "permission-denied":
            setError("മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചിരിക്കുന്നു. ബ്രൗസർ ക്രമീകരണങ്ങൾ പരിശോധിക്കുക.");
            break;
          case "no-speech":
            setError("സ്പീച്ച് കണ്ടെത്താനായില്ല. വീണ്ടും ശ്രമിക്കുക.");
            break;
          case "audio-capture":
            setError("ഓഡിയോ ഉപകരണം കണ്ടെത്താനായില്ല.");
            break;
          default:
            setError(`പിശക്: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (listening) {
          try {
            recognition.start(); // Restart if still listening
          } catch (err) {
            console.error("Failed to restart recognition", err);
            setListening(false);
          }
        }
      };

      recognition.start();
      setListening(true);
      setTranscript("");
    } catch (err) {
      console.error("Failed to initialize speech recognition", err);
      setError("സ്പീച്ച് റികഗ്നിഷൻ ആരംഭിക്കാൻ കഴിഞ്ഞില്ല. നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setTranscript("");
      
      // Process the final question if available
      if (question) {
        processQuestion(question);
      }
    }
  };

  const processQuestion = async (text: string) => {
    setProcessing(true);
    setAnswer("");
    setError(null);
    
    try {
      // Call Gemini API
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: text }),
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setAnswer(data.reply);

      // Speak output
      const speak = new SpeechSynthesisUtterance(data.reply);
      speak.lang = "ml-IN";
      speak.onend = () => setProcessing(false);
      speak.onerror = (event) => {
        console.error("Speech synthesis error", event);
        setProcessing(false);
      };
      window.speechSynthesis.speak(speak);
    } catch (error: any) {
      console.error("Error processing question:", error);
      setError("ക്ഷമിക്കണം, എന്തോ പ്രശ്നം ഉണ്ടായി. വീണ്ടും ശ്രമിക്കുക.");
      setAnswer("ക്ഷമിക്കണം, എന്തോ പ്രശ്നം ഉണ്ടായി. വീണ്ടും ശ്രമിക്കുക.");
      setProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <span>🎤</span> ജെമിനി മലയാളം വോയ്‌സ് അസിസ്റ്റന്റ്
          </h1>
          <p className="mt-2 opacity-90">സംസാരിക്കുക, ഞാൻ നിങ്ങളെ സഹായിക്കാം</p>
        </div>

        <div className="p-6">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="font-medium">പിശക്:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Transcript display */}
          <div className="mb-8 min-h-[120px] bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">നിങ്ങൾ പറയുന്നത്:</div>
            <div className="text-xl font-medium text-gray-800 min-h-[60px] flex items-center">
              {transcript || question || (
                <span className="text-gray-400 italic">
                  {listening ? "സംസാരിക്കാൻ തുടങ്ങൂ..." : "ഒന്നും കേൾക്കാത്തതായി..."}
                </span>
              )}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex justify-center gap-4 mb-8">
            {!listening ? (
              <button
                onClick={startListening}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-lg font-semibold"
              >
                <span className="text-2xl">🎙</span> സംസാരിക്കാൻ തുടങ്ങുക
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-lg font-semibold"
              >
                <span className="text-2xl">⏹</span> നിർത്തുക
              </button>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${listening ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${listening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{listening ? 'കേൾക്കുന്നു...' : 'കാത്തിരിക്കുന്നു'}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${processing ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{processing ? 'പ്രോസസ്സ് ചെയ്യുന്നു...' : 'തയ്യാറാണ്'}</span>
            </div>
          </div>

          {/* Answer display */}
          {answer && (
            <div className="mt-6 bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <div className="text-sm text-indigo-600 font-medium mb-2">എന്റെ മറുപടി:</div>
              <div className="text-lg text-gray-800 font-medium whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}