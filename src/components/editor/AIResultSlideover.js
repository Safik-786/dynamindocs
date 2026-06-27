"use client";

import { Close, AutoFixHigh, Summarize, Checklist, KeyboardReturn } from "@mui/icons-material";
import { Slideover } from "./Slideover";

export function AIResultSlideover({ isOpen, onClose, result, onReplace, onInsert }) {
  if (!isOpen || !result) return null;

  const { type, data, originalText } = result;

  const renderContent = () => {
    if (type === 'summary') {
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {data}
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
        </div>
      );
    }
  };

  const renderFooter = () => {
    if (type === 'summary') {
      return (
        <button 
          onClick={onInsert}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <KeyboardReturn fontSize="small" />
          Apply Summary
        </button>
      );
    }
    
    if (type === 'rewrite') {
      return (
        <button 
          onClick={onReplace}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <KeyboardReturn fontSize="small" />
          Replace with Rewritten Text
        </button>
      );
    }
    
    return null;
  };

  const getTitleInfo = () => {
    if (type === 'summary') return { title: 'AI Summary', icon: <Summarize fontSize="small" className="text-green-600" /> };
    if (type === 'tasks') return { title: 'Extracted Tasks', icon: <Checklist fontSize="small" className="text-green-600" /> };
    if (type === 'rewrite') return { title: 'Rewritten Text', icon: <AutoFixHigh fontSize="small" className="text-green-600" /> };
    return { title: 'AI Result', icon: null };
  };

  const { title, icon } = getTitleInfo();

  return (
    <Slideover
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      footer={renderFooter()}
    >
      {renderContent()}
    </Slideover>
  );
}
