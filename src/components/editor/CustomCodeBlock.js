import CodeBlock from '@tiptap/extension-code-block'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlockComponent from './CodeBlockComponent'

export const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  },
})
