import { useState, useEffect } from 'react';
import { Close, Link as LinkIcon, PersonAdd, Delete } from '@mui/icons-material';

export function ShareModal({ isOpen, onClose, documentId, currentUserRole }) {
  const [members, setMembers] = useState([]);
  const [owner, setOwner] = useState(null);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [roleToInvite, setRoleToInvite] = useState("EDITOR");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/members`);
      if (res.ok) {
        const json = await res.json();
        setOwner(json.data?.owner);
        setMembers(json.data?.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setError("");
      setEmailToInvite("");
    }
  }, [isOpen, documentId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!emailToInvite.trim()) return;
    setIsInviting(true);
    setError("");
    
    try {
      const res = await fetch(`/api/v1/documents/${documentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToInvite, role: roleToInvite })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to invite user");
      
      setEmailToInvite("");
      fetchMembers();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await fetch(`/api/v1/documents/${documentId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await fetch(`/api/v1/documents/${documentId}/members/${memberId}`, {
        method: 'DELETE'
      });
      fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isOwner = currentUserRole === "OWNER";

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-[60] transform transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <PersonAdd fontSize="small" className="text-blue-600" /> Share Document
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 w-7 h-7 flex items-center justify-center rounded-full shrink-0 hover:bg-gray-200 transition-colors">
          <Close fontSize="small" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite Section */}
          {isOwner ? (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Add people by email..." 
                  value={emailToInvite}
                  onChange={(e) => setEmailToInvite(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <select 
                  value={roleToInvite}
                  onChange={(e) => setRoleToInvite(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <button 
                type="submit"
                disabled={!emailToInvite.trim() || isInviting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PersonAdd fontSize="small" sx={{ fontSize: 18 }} />
                {isInviting ? "Inviting..." : "Send Invite"}
              </button>
            </form>
          ) : (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
              Only the owner can invite new members.
            </div>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">People with access</h3>
            <div className="space-y-4">
              {/* Owner */}
              {owner && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {owner.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{owner.name} (You)</p>
                      <p className="text-xs text-gray-500">{owner.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Owner</span>
                </div>
              )}

              {/* Members */}
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm">
                      {member.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <select 
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="text-xs text-gray-600 bg-transparent cursor-pointer hover:bg-gray-100 p-1 rounded outline-none"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Remove access"
                      >
                        <Delete fontSize="small" sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 capitalize">{member.role.toLowerCase()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center mt-auto">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LinkIcon fontSize="small" sx={{ fontSize: 18 }} />
            {copied ? "Link copied!" : "Copy link"}
          </button>
          <button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Done
          </button>
        </div>
    </div>
  );
}
