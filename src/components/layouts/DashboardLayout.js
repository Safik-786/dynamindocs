"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Description as DocIcon, AccountCircle, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useDocuments } from "@/modules/documents/hooks";

export default function DashboardLayout({ children, titleSlot, rightControlsSlot }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { data: documents } = useDocuments();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const editDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setEditDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#F9FBFD] overflow-hidden">
      {/* Google Docs Style Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          {/* Document Icon linking back to dashboard */}
          <Link href="/dashboard" className="text-primary hover:opacity-80 transition-opacity">
            <DocIcon sx={{ fontSize: 40 }} />
          </Link>
          
          <div className="flex items-center gap-6">
            
            {/* Menu Bar */}
            <div className="flex items-center gap-2 mt-0.5">
              <Link 
                href="/dashboard"
                className={`px-2 py-1 text-[13px] rounded transition-colors font-medium ${
                  pathname === "/dashboard"
                    ? "text-primary bg-blue-50" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Files
              </Link>

              {/* Edit Dropdown */}
              <div className="relative" ref={editDropdownRef}>
                <button 
                  onClick={() => setEditDropdownOpen(!editDropdownOpen)}
                  className={`flex items-center px-2 py-1 text-[13px] rounded transition-colors font-medium ${
                    pathname.startsWith("/document/")
                      ? "text-primary bg-blue-50" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Edit
                  <ExpandMoreIcon sx={{ fontSize: 16, ml: 0.5 }} />
                </button>
                
                {editDropdownOpen && (
                  <div className="absolute left-0 top-[110%] w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Select a Document
                    </div>
                    {documents?.length > 0 ? (
                      documents.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setEditDropdownOpen(false);
                            router.push(`/document/${doc.id}`);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors line-clamp-1"
                        >
                          {doc.title}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 italic">
                        No documents found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {session?.user?.roles?.includes('ADMIN') && (
                <>
                  <Link href="/users" className={`px-2 py-1 text-[13px] rounded transition-colors font-medium ${pathname === "/users" ? "text-primary bg-blue-50" : "text-gray-600 hover:bg-gray-100"}`}>Users</Link>
                  <Link href="/rbac" className={`px-2 py-1 text-[13px] rounded transition-colors font-medium ${pathname === "/rbac" ? "text-primary bg-blue-50" : "text-gray-600 hover:bg-gray-100"}`}>RBAC</Link>
                </>
              )}
              <Link href="#" className="px-2 py-1 text-[13px] text-gray-600 hover:bg-gray-100 rounded transition-colors font-medium">Settings</Link>
            </div>

            {/* Title / Document Name (Moved to the right side of the menu) */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              {titleSlot ? titleSlot : (
                <h1 className="px-1.5 py-0.5 text-sm uppercase font-black truncate max-w-sm bg-gradient-to-r from-green-400 to-green-700 text-transparent bg-clip-text">
                  DDOCS
                </h1>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          {rightControlsSlot}
          
          {session && (
            <>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold overflow-hidden border border-gray-200 shrink-0 hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none"
              >
                 {session?.user?.name?.[0]?.toUpperCase() || <AccountCircle />}
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-[110%] w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {session.user.email}
                    </p>
                  </div>
                  <div className="px-2">
                    <button 
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Outlet Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
