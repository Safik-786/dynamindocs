import { Close } from "@mui/icons-material";

export function Slideover({ isOpen, onClose, title, icon, children, footer, width = 'w-[400px]' }) {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-0 right-0 h-full ${width} bg-gray-50 shadow-2xl border-l border-gray-200 flex flex-col z-[60] transform transition-transform`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          {icon} {title}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 w-7 h-7 flex items-center justify-center rounded-full shrink-0 hover:bg-gray-200 transition-colors">
          <Close fontSize="small" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>

      {footer && (
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
