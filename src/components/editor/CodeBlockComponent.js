import React, { useState } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { ContentCopy as CopyIcon, Check as CheckIcon } from '@mui/icons-material'

export default function CodeBlockComponent({ node, updateAttributes, extension }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper className="code-block my-6 rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white transition-all hover:shadow-md">
      {/* Mac-style Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 select-none" contentEditable={false}>
        {/* Mac Traffic Lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm border border-[#e0443e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm border border-[#dea123]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm border border-[#1aab29]"></div>
        </div>
        
        {/* Copy Button */}
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
        >
          {copied ? <CheckIcon sx={{ fontSize: 14 }} className="text-green-600" /> : <CopyIcon sx={{ fontSize: 14 }} />}
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-sm text-gray-800 font-mono !bg-white !m-0 !border-0 !rounded-none selection:bg-blue-100">
        <NodeViewContent as="code" className="!bg-white !p-0 !text-inherit" />
      </pre>
    </NodeViewWrapper>
  )
}
