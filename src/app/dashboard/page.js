"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useDocuments, useCreateDocument } from "@/modules/documents/hooks";
import { Button } from "@mui/material";
import { Add as AddIcon, Description as DocIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const { data: documents, isLoading, error } = useDocuments();
  const createMutation = useCreateDocument();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const newDoc = await createMutation.mutateAsync(title);
      setOpen(false);
      setTitle("");
      router.push(`/document/${newDoc.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex p-6 flex-col sm:flex-row justify-between items-start sm:items-center  gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
            My Documents
          </h1>
          <p className="text-base text-slate-500">
            Manage and organize your collaborative workspace
          </p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpen(true)}
          className="shadow-lg shadow-primary/30 bg-primary hover:bg-primary-hover border-0 py-2.5 px-6"
        >
          New Document
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          Failed to load documents. Please try again.
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center mt-20 flex flex-col items-center glass-panel p-12 border rounded-3xl max-w-lg mx-auto bg-white shadow-sm">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <DocIcon sx={{ fontSize: 40 }} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No documents yet</h2>
          <p className="text-base text-slate-500 mb-8 max-w-sm">
            Create a new document to get started with real-time collaboration.
          </p>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            className="shadow-lg shadow-primary/30 px-8 py-3 bg-primary hover:bg-primary-hover"
          >
            Create Your First Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-6">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              className="group shadow hover:shadow-[0_20px_40px_-15px_var(--color-primary-200)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col bg-white overflow-hidden relative rounded-xl border border-slate-200" 
              onClick={() => router.push(`/document/${doc.id}`)}
            >
            
              <div className="flex-grow p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <DocIcon fontSize="small" />
                  </div>
                  <button className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); }}>
                    <MoreVertIcon fontSize="small" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 line-clamp-1 mb-1 group-hover:text-primary transition-colors" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold">
                     {doc.owner?.name?.[0]?.toUpperCase() || 'U'}
                   </div>
                   <span className="text-xs text-slate-600 font-medium line-clamp-1 max-w-[120px]">
                    {doc.owner?.name}
                  </span>
                </div>
                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Document Dialog Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 w-full max-w-sm">
            <div className="h-2 w-full bg-primary"></div>
            <div className="pt-6 px-6 pb-2">
              <h2 className="font-bold text-slate-800 text-lg">Create New Document</h2>
              <p className="text-slate-500 text-sm mt-2 mb-4">
                Give your new document a descriptive title. You can change this later.
              </p>
              <input
                autoFocus
                type="text"
                placeholder="Document Title"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="p-6 pt-4 flex justify-end gap-3 items-center">
              <Button onClick={() => setOpen(false)} className="text-slate-500 hover:bg-slate-100 rounded-lg px-4 normal-case font-medium">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                variant="contained"
                disabled={!title.trim() || createMutation.isPending}
                className="shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover rounded-lg px-6"
              >
                {createMutation.isPending ? "Creating..." : "Create Document"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
