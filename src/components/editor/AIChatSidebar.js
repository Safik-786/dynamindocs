"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import { Close, Send, AutoAwesome } from "@mui/icons-material";

export function AIChatSidebar({ isOpen, onClose, getDocumentText }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/v1/ai/chat",
    body: {
      documentText: isOpen ? getDocumentText() : "",
    },
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <AutoAwesome fontSize="small" className="text-indigo-600" /> AI Assistant
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
                    ? "bg-blue-600 text-white rounded-br-none"
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about the document..."
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
          >
            <Send fontSize="small" sx={{ fontSize: 16 }} />
          </button>
        </div>
      </form>
    </div>
  );
}
