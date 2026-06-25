"use client";

import { use, useState, useEffect } from "react";
import DocumentEditor from "@/components/editor/DocumentEditor";
import { useDocument, useUpdateDocument } from "@/modules/documents/hooks";
import { Description as DocIcon, StarBorder as StarIcon, Star as StarFilledIcon, Share as ShareIcon, AccountCircle } from "@mui/icons-material";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function DocumentPage({ params }) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;

  const { data: session } = useSession();
  const { data: document, isLoading } = useDocument(documentId);
  const updateMutation = useUpdateDocument(documentId);

  const [title, setTitle] = useState("Untitled document");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
    }
  }, [document]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() !== document?.title && title.trim() !== "") {
      updateMutation.mutate(title.trim());
    } else if (title.trim() === "") {
      setTitle(document?.title || "Untitled document");
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const menuItems = [
    { label: "Files", href: "/dashboard" },
    { label: "Users", href: "#" },
    { label: "Settings", href: "#" },
    { label: "RBAC", href: "#" }
  ];

  return (
    <DashboardLayout
      titleSlot={
        <>
          {/* Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="px-1.5 py-0.5 text-lg text-gray-800 border-2 border-blue-500 rounded focus:outline-none w-64 bg-white h-[32px]"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="px-1.5 py-0.5 text-lg text-gray-800 hover:ring-1 hover:ring-gray-300 rounded cursor-text truncate max-w-sm transition-all h-[32px] flex items-center"
            >
              {isLoading ? "Loading..." : title}
            </h1>
          )}

          {/* Star Icon */}
          <button
            onClick={() => setIsStarred(!isStarred)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isStarred ? <StarFilledIcon className="text-yellow-400" fontSize="small" /> : <StarIcon fontSize="small" />}
          </button>
        </>
      }
      rightControlsSlot={
        session?.user && (
          <div className="flex flex-col items-end justify-center mr-2">
            <span className="text-sm font-bold text-gray-800 leading-tight">{session.user.name}</span>
            <span className="text-[11px] text-gray-500 font-medium leading-tight">{session.user.email}</span>
          </div>
        )
      }
    >
      <DocumentEditor documentId={documentId} />
    </DashboardLayout>
  );
}
