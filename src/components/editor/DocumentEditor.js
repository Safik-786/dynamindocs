"use client";

import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { yXmlFragmentToProsemirrorJSON } from 'y-prosemirror';
import { queueSyncOperation, getPendingOperations, clearSyncedOperations, db } from '@/lib/localDb';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import { 
  FormatBold, FormatItalic, StrikethroughS, Code,
  FormatListBulleted, FormatListNumbered, FormatQuote,
  FormatColorText, FormatColorFill, History, Close, Restore, PersonAdd,
  AutoAwesome, Summarize, AutoFixHigh, Checklist
} from '@mui/icons-material';
import { ShareModal } from './ShareModal';
import { AIChatSidebar } from './AIChatSidebar';
import { AIResultSlideover } from './AIResultSlideover';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { CustomCodeBlock } from './CustomCodeBlock';

export default function DocumentEditor({ documentId, onSyncStatusChange }) {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Offline");
  const [userRole, setUserRole] = useState(null); // OWNER, EDITOR, VIEWER
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Version History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [newVersionName, setNewVersionName] = useState("");
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);

  // AI State
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResult, setAiResult] = useState({ isOpen: false, type: null, data: null, originalText: null, selection: null });
  
  const ydocRef = useRef(new Y.Doc());
  const socketRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Initialize TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false, codeBlock: false }),
      CustomCodeBlock,
      Collaboration.configure({ document: ydocRef.current }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-full',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const ydoc = ydocRef.current;
    if (!ydoc.clientID) ydoc.clientID = Math.floor(Math.random() * 10000000);

    let socket;

    // Native browser Base64 decoding (avoids Turbopack Buffer polyfill bugs)
    const toUint8Array = (base64) => {
      if (!base64) return new Uint8Array(0);
      try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch (e) {
        console.error("Failed to decode base64:", e);
        return new Uint8Array(0);
      }
    };

    // Native browser Base64 encoding
    const fromUint8Array = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const handleUpdate = async (update, origin) => {
      // Ignore updates that came from the server/websocket to avoid loops
      if (origin === 'server-sync' || origin === 'websocket') return;
      
      const base64Update = fromUint8Array(update);

      // A) Save update to local Dexie SyncQueue
      const clock = Date.now(); 
      await queueSyncOperation(documentId, ydoc.clientID, clock, update);
      
      // B) Broadcast real-time to other clients
      if (socket && socket.connected) {
        socket.emit("yjs-update", { documentId, update: base64Update });
      }

      // C) Flush to DB
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => attemptSync(), 1000);
    };

    ydoc.on('update', handleUpdate);

    const init = async () => {
      // Fetch initial state from server
      try {
        const res = await fetch(`/api/v1/documents/${documentId}/state`);
        if (res.ok) {
          const json = await res.json();
          setUserRole(json.data?.role);
          
          if (json.data && json.data.state) {
            let base64String = json.data.state;
            const update = toUint8Array(base64String);
            Y.applyUpdate(ydoc, update, 'server-sync');
          }
        }
      } catch (err) {
        console.error("Failed to load initial document state", err);
      }

      // Connect to WebSocket
      const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001";
      socket = io(socketUrl);
      socketRef.current = socket;

      socket.on("connect", async () => {
        setSyncStatus("Connected (Real-time)");
        socket.emit("join-document", documentId);
        
        // TEMPORARY FIX: Wipe corrupted browser IndexedDB queue 
        // to prevent it from re-uploading corrupted operations to the clean server
        try {
          await db.syncQueue.clear();
        } catch (e) {
          console.error("Failed to clear local DB", e);
        }

        attemptSync(); // flush any offline operations
      });

      socket.on("disconnect", () => {
        setSyncStatus("Offline (Saved Locally)");
      });

      socket.on("yjs-update", (base64Update) => {
        try {
          const update = toUint8Array(base64Update);
          Y.applyUpdate(ydoc, update, 'websocket');
        } catch (e) {
          console.error("Failed applying remote update:", e);
        }
      });

      setIsReady(true);
    };

    init();

    return () => {
      ydoc.off('update', handleUpdate);
      if (socket) socket.disconnect();
    };
  }, [documentId]);

  const attemptSync = async () => {
    // Viewers are completely blocked from syncing local changes to the server
    if (userRole === "VIEWER") {
      setSyncStatus("Read Only");
      return;
    }

    if (!navigator.onLine) {
      setSyncStatus("Offline (Saved Locally)");
      return;
    }

    try {
      if (socketRef.current?.connected) setSyncStatus("Syncing...");
      const pendingOps = await getPendingOperations(documentId);
      
      if (pendingOps.length === 0) {
        if (socketRef.current?.connected) setSyncStatus("Connected (Real-time)");
        return;
      }

      const operations = pendingOps.map(op => ({
        clientId: op.clientId,
        clock: op.clock,
        update: op.update 
      }));

      const res = await fetch(`/api/v1/documents/${documentId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations })
      });

      if (!res.ok) throw new Error("Sync failed");
      
      await clearSyncedOperations(pendingOps.map(op => op.id));
      if (socketRef.current?.connected) setSyncStatus("Connected (Real-time)");
      else setSyncStatus("Saved (Online)");
      
    } catch (err) {
      console.error(err);
      if (!socketRef.current?.connected) setSyncStatus("Offline (Saved Locally)");
    }
  };

  useEffect(() => {
    const handleOnline = () => attemptSync();
    window.addEventListener('online', handleOnline);
    const interval = setInterval(attemptSync, 5000);
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [documentId]);

  useEffect(() => {
    if (onSyncStatusChange) {
      onSyncStatusChange(syncStatus);
    }
  }, [syncStatus, onSyncStatusChange]);

  // AI Features Logic
  const getDocumentText = () => {
    return editor ? editor.getText() : "";
  };

  const handleSummarize = async () => {
    const text = getDocumentText();
    if (!text) return;
    setIsAILoading(true);
    try {
      const res = await fetch('/api/v1/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text })
      });
      const data = await res.json();
      if (data.summary) {
        setAiResult({ isOpen: true, type: 'summary', data: data.summary, originalText: null, selection: null });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert("Please highlight text to rewrite.");
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    setIsAILoading(true);
    try {
      const res = await fetch('/api/v1/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, tone: 'professional' })
      });
      const data = await res.json();
      if (data.rewrittenText) {
        setAiResult({ isOpen: true, type: 'rewrite', data: data.rewrittenText, originalText: selectedText, selection: { from, to } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleActionItems = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    let text;
    if (from !== to) {
      text = editor.state.doc.textBetween(from, to, ' ');
    } else {
      text = getDocumentText();
    }
    
    if (!text) return;
    setIsAILoading(true);
    try {
      const res = await fetch('/api/v1/ai/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text })
      });
      const data = await res.json();
      if (data.actionItems) {
        setAiResult({ isOpen: true, type: 'tasks', data: data.actionItems, originalText: null, selection: null });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleReplaceRewrite = () => {
    if (editor && aiResult.type === 'rewrite' && aiResult.selection) {
      const { from, to } = aiResult.selection;
      editor.commands.insertContentAt({ from, to }, aiResult.data);
      setAiResult({ ...aiResult, isOpen: false });
    }
  };

  const handleInsertSummary = () => {
    if (editor && aiResult.type === 'summary') {
      editor.commands.insertContent(`\n\n**AI Summary:**\n${aiResult.data}\n\n`);
      setAiResult({ ...aiResult, isOpen: false });
    }
  };

  // Version History Logic
  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/versions`);
      if (res.ok) {
        const json = await res.json();
        setVersions(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) fetchVersions();
  }, [isHistoryOpen, documentId]);

  // Lock editor if viewer
  useEffect(() => {
    if (editor && userRole) {
      editor.setEditable(userRole !== "VIEWER");
    }
  }, [editor, userRole]);

  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) return;
    setIsSavingVersion(true);
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVersionName })
      });
      if (res.ok) {
        setNewVersionName("");
        fetchVersions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!confirm("Are you sure you want to restore this version? This will become the new current state for everyone.")) return;
    setIsRestoringVersion(true);
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/versions/${versionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.state) {
          const binaryString = atob(json.data.state);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const tempDoc = new Y.Doc();
          Y.applyUpdate(tempDoc, bytes);
          const jsonContent = yXmlFragmentToProsemirrorJSON(tempDoc.getXmlFragment('default'));
          
          // Use Tiptap to replace the entire document content.
          // This generates valid CRDT delete/insert operations, preserving history!
          editor.commands.setContent(jsonContent);
          setIsHistoryOpen(false);
        }
      }
    } catch (e) {
      console.error("Failed to restore version", e);
    } finally {
      setIsRestoringVersion(false);
    }
  };

  if (!editor || !isReady) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-8 mt-10">
        {/* Toolbar Skeleton */}
        <div className="flex gap-3 mb-10 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-8"></div>
          <div className="h-8 bg-gray-200 rounded-md w-8"></div>
          <div className="h-8 bg-gray-200 rounded-md w-8"></div>
          <div className="h-8 bg-gray-200 rounded-md w-16 ml-4"></div>
          <div className="h-8 bg-gray-200 rounded-md w-16"></div>
        </div>
        
        {/* Document Body Skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Title block */}
          <div className="h-12 bg-gray-200 rounded-md w-2/3 mb-10"></div>
          
          {/* Paragraph 1 */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
          
          {/* Paragraph 2 */}
          <div className="space-y-3 pt-4">
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          
          {/* Paragraph 3 */}
          <div className="space-y-3 pt-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const isOffline = syncStatus.includes("Offline");

  return (
    <div 
      className="flex flex-col h-full w-full relative transition-all duration-300"
      style={{ paddingRight: aiResult.isOpen ? '400px' : (isAIChatOpen || isHistoryOpen) ? '320px' : '0px' }}
    >
      {/* Google Docs Style Toolbar */}
      <div 
        className="bg-[#EDF2FA] rounded-full mx-4 mt-2 px-4 py-1.5 flex items-center justify-between shrink-0 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        {/* Formatting Tools (Hidden for Viewers) */}
        <div className="flex gap-1 items-center shrink-0">
          {userRole !== "VIEWER" ? (
            <>
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('bold') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Bold"
          >
            <FormatBold fontSize="small" />
          </button>
          
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('italic') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Italic"
          >
            <FormatItalic fontSize="small" />
          </button>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('strike') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Strikethrough"
          >
            <StrikethroughS fontSize="small" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          {/* Text Color */}
          <div className="relative flex items-center hover:bg-gray-200 rounded px-1 h-8 cursor-pointer" title="Text Color">
            <FormatColorText fontSize="small" className="text-gray-700" />
            <input 
              type="color" 
              onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </div>

          {/* Background Color */}
          <div className="relative flex items-center hover:bg-gray-200 rounded px-1 h-8 cursor-pointer" title="Highlight Color">
            <FormatColorFill fontSize="small" className="text-gray-700" />
            <input 
              type="color" 
              onInput={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
              value={editor.getAttributes('highlight').color || '#ffffff'}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </div>

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
              }
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              editor.isActive('heading', { level: 4 }) ? '4' :
              editor.isActive('heading', { level: 5 }) ? '5' :
              editor.isActive('heading', { level: 6 }) ? '6' : 'p'
            }
            className="h-8 border-none bg-transparent text-sm text-gray-700 font-medium focus:outline-none cursor-pointer hover:bg-gray-200 rounded px-1"
            title="Styles"
          >
            <option value="p">Normal text</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('bulletList') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Bullet List"
          >
            <FormatListBulleted fontSize="small" />
          </button>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('orderedList') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Numbered List"
          >
            <FormatListNumbered fontSize="small" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('blockquote') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Quote"
          >
            <FormatQuote fontSize="small" />
          </button>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded text-sm ${
              editor.isActive('codeBlock') 
                ? 'bg-[#D3E3FD] text-[#041E49]' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Code Block"
          >
            <Code fontSize="small" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          {/* AI Tools */}
          <button 
            onClick={handleSummarize}
            disabled={isAILoading}
            className="cursor-pointer flex items-center gap-1 w-auto h-8 px-2 rounded text-[12px] whitespace-nowrap font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Summarize Document"
          >
            <Summarize fontSize="small" className="text-gray-700" />
            Summarize
          </button>

          <button 
            onClick={handleRewrite}
            disabled={isAILoading}
            className="cursor-pointer flex items-center gap-1 w-auto h-8 px-2 rounded text-[12px] whitespace-nowrap font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Rewrite highlighted text"
          >
            <AutoFixHigh fontSize="small" className="text-gray-700" />
            Rewrite
          </button>

          <button 
            onClick={handleActionItems}
            disabled={isAILoading}
            className="cursor-pointer flex items-center gap-1 w-auto h-8 px-2 rounded text-[12px] whitespace-nowrap font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Extract Tasks (Highlight specific tasks in your text, or leave unselected to scan the whole document)"
          >
            <Checklist fontSize="small" className="text-gray-700" />
            Tasks
          </button>
            </>
          ) : (
            <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 bg-gray-200 rounded">
              Read Only Mode
            </div>
          )}
        </div>
        
        {/* Share & History */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          
          <button 
            onClick={() => setIsAIChatOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 text-[12px] whitespace-nowrap font-medium text-gray-700 hover:bg-gray-200 px-2 h-8 rounded transition-colors"
          >
            <AutoAwesome fontSize="small" className="text-gray-700" />
            AI CHAT
          </button>

          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 text-[12px] whitespace-nowrap font-medium text-gray-700 hover:bg-gray-200 px-2 h-8 rounded transition-colors"
          >
            <History fontSize="small" className="text-gray-700" />
            HISTORY
          </button>

          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-4 py-1.5 rounded-full transition-colors ml-2"
          >
            <PersonAdd fontSize="small" />
            Share
          </button>
        </div>
      </div>
      
      {/* Editor Canvas (A4 Page) */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-[816px] mx-auto min-h-[1056px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-gray-200 p-12 md:p-20 transition-all duration-300">
          <EditorContent editor={editor} className="min-h-full" />
        </div>
      </div>

      {/* Version History Sidebar */}
      {isHistoryOpen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <History fontSize="small" /> Version History
            </h2>
            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
              <Close fontSize="small" />
            </button>
          </div>

          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-1">Save Current State</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g., Draft 1" 
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={handleSaveVersion}
                disabled={!newVersionName.trim() || isSavingVersion}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
              >
                {isSavingVersion ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {versions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No saved versions yet.</p>
            ) : (
              versions.map((v, i) => (
                <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-colors relative group">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm text-gray-800">{v.name}</h3>
                    {i === 0 && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Latest</span>}
                  </div>
                  
                  {/* Author Info */}
                  {v.author && (
                    <div className="flex items-center gap-1.5 mb-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {v.author.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{v.author.name}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 mb-3">
                    {new Date(v.createdAt).toLocaleString()}
                  </p>
                  <button 
                    onClick={() => handleRestoreVersion(v.id)}
                    disabled={isRestoringVersion}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <Restore fontSize="small" sx={{ fontSize: 14 }} />
                    Restore this version
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={documentId}
        currentUserRole={userRole}
      />

      <AIChatSidebar 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)}
        getDocumentText={getDocumentText}
      />

      <AIResultSlideover 
        isOpen={aiResult.isOpen}
        onClose={() => setAiResult({ ...aiResult, isOpen: false })}
        result={aiResult}
        onReplace={handleReplaceRewrite}
        onInsert={handleInsertSummary}
      />
    </div>
  );
}
