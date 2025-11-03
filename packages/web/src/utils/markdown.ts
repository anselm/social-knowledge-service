import { marked } from 'marked'

// Configure marked options for security and consistency
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Don't add IDs to headers
  mangle: false, // Don't mangle email addresses
})

export function renderMarkdown(content: string): string {
  if (!content) return ''
  
  try {
    // Parse markdown to HTML
    const html = marked.parse(content)
    return html
  } catch (error) {
    console.error('Failed to parse markdown:', error)
    // Return escaped content as fallback
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
