"use client";

import { useState, useEffect, useRef } from "react";
import { Close, Send, AutoAwesome } from "@mui/icons-material";

export function AIChatSidebar({ isOpen, onClose, getDocumentText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input.trim() 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentText: getDocumentText()
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to fetch response");
      }
      
      if (data.reply) {
        setMessages((prev) => [
          ...prev, 
          { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply }
        ]);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    // In a simple fetch setup, we can't easily abort a fetch mid-flight without AbortController.
    // We can just reset loading state to allow the user to try again.
    setIsLoading(false);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 flex flex-col z-50 transform transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <AutoAwesome fontSize="small" className="text-primary" /> AI Assistant
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <Close fontSize="small" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 mt-10">
            <AutoAwesome className="mx-auto mb-2 opacity-50" fontSize="large" />
            <p>Ask me anything about this document!</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${
                m.role === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`p-3 rounded-lg text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                }`}
              >
                {m.content}
              </div>
              <span className={`text-[10px] text-gray-400 mt-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                {m.role === "user" ? "You" : "AI"}
              </span>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-1 items-center p-3 bg-white border border-gray-200 w-16 rounded-lg rounded-bl-none shadow-sm">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-xs p-2 text-center bg-red-50 rounded-lg">
            An error occurred: {error.message || "Failed to load response."}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the document..."
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              className="absolute right-1 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            >
              <Close fontSize="small" sx={{ fontSize: 16 }} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input || input.trim().length === 0}
              className="absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Send fontSize="small" sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
