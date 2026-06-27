"use client";

import { Close, AutoFixHigh, Summarize, Checklist, KeyboardReturn } from "@mui/icons-material";

export function AIResultSlideover({ isOpen, onClose, result, onReplace, onInsert }) {
  if (!isOpen || !result) return null;

  const { type, data, originalText } = result;

  const renderContent = () => {
    if (type === 'summary') {
      return (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {data}
          </div>
          <button 
            onClick={onInsert}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <KeyboardReturn fontSize="small" />
            Apply Summary
          </button>
        </div>
      );
    }
    
    if (type === 'tasks') {
      return (
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm text-gray-800">{item}</span>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-gray-500 italic">No tasks found.</p>
          )}
        </div>
      );
    }

    if (type === 'rewrite') {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Text</h3>
            <div className="bg-red-50 text-red-900 p-4 rounded-lg border border-red-100 text-sm whitespace-pre-wrap line-through opacity-80">
              {originalText}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rewritten Text</h3>
            <div className="bg-green-50 text-green-900 p-4 rounded-lg border border-green-200 text-sm whitespace-pre-wrap font-medium">
              {data}
            </div>
          </div>

          <button 
            onClick={onReplace}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <KeyboardReturn fontSize="small" />
            Replace with Rewritten Text
          </button>
        </div>
      );
    }
  };

  const getTitleInfo = () => {
    if (type === 'summary') return { title: 'AI Summary', icon: <Summarize fontSize="small" className="text-green-600" /> };
    if (type === 'tasks') return { title: 'Extracted Tasks', icon: <Checklist fontSize="small" className="text-green-600" /> };
    if (type === 'rewrite') return { title: 'Rewritten Text', icon: <AutoFixHigh fontSize="small" className="text-green-600" /> };
    return { title: 'AI Result', icon: null };
  };

  const { title, icon } = getTitleInfo();

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] bg-gray-50 shadow-2xl border-l border-gray-200 flex flex-col z-[60] transform transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          {icon} {title}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 w-7 h-7 flex items-center justify-center rounded-full shrink-0 hover:bg-gray-200 transition-colors">
          <Close fontSize="small" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {renderContent()}
      </div>
    </div>
  );
}
