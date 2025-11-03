#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

/// Simple documentation generator that extracts triple slash comments
/// and generates markdown documentation

const SUPPORTED_EXTENSIONS = ['.ts', '.js', '.mjs']

/// Parse triple slash comment block and extract structured information
/// @param commentBlock - Raw comment block text
/// @returns Object with parsed documentation structure
function parseTripleSlashBlock(commentBlock) {
  const lines = commentBlock.split('\n').map(line => line.trim().replace(/^\/\/\/\s?/, ''))
  
  const doc = {
    description: [],
    topic: null,
    class: null,
    function: null,
    params: [],
    returns: null
  }
  
  let currentSection = 'description'
  
  for (const line of lines) {
    if (line.startsWith('@topic ')) {
      doc.topic = line.substring(7).trim()
      currentSection = 'topic'
    } else if (line.startsWith('@class ')) {
      doc.class = line.substring(7).trim()
      currentSection = 'class'
    } else if (line.startsWith('@function ')) {
      doc.function = line.substring(10).trim()
      currentSection = 'function'
    } else if (line.startsWith('@param ')) {
      doc.params.push(line.substring(7).trim())
      currentSection = 'param'
    } else if (line.startsWith('@returns ')) {
      doc.returns = line.substring(9).trim()
      currentSection = 'returns'
    } else if (line && currentSection === 'description') {
      doc.description.push(line)
    }
  }
  
  return doc
}

/// Extract triple slash comments from source code
/// @param content - Source code content as string
/// @returns Array of parsed documentation objects
function extractTripleSlashComments(content) {
  const comments = []
  
  // Split content into lines and look for consecutive triple slash comments
  const lines = content.split('\n')
  let currentBlock = []
  let blockStartLine = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.startsWith('///')) {
      if (currentBlock.length === 0) {
        blockStartLine = i
      }
      currentBlock.push(line)
    } else {
      // If we have accumulated triple slash lines, process them
      if (currentBlock.length > 0) {
        const commentBlock = currentBlock.join('\n')
        const parsed = parseTripleSlashBlock(commentBlock)
        
        // Detect what the comment is documenting by looking at following code
        const codeContext = detectCodeContext(lines, i)
        if (codeContext) {
          parsed.detectedType = codeContext.type
          parsed.detectedName = codeContext.name
        }
        
        // Only include if it has meaningful content
        if (parsed.description.length > 0 || parsed.topic || parsed.class || parsed.function) {
          comments.push(parsed)
        }
        currentBlock = []
        blockStartLine = -1
      }
    }
  }
  
  // Handle case where file ends with triple slash comments
  if (currentBlock.length > 0) {
    const commentBlock = currentBlock.join('\n')
    const parsed = parseTripleSlashBlock(commentBlock)
    
    if (parsed.description.length > 0 || parsed.topic || parsed.class || parsed.function) {
      comments.push(parsed)
    }
  }
  
  return comments
}

/// Detect what type of code element follows a comment block
/// @param lines - Array of source code lines
/// @param startIndex - Index to start looking for code
/// @returns Object with type and name, or null
function detectCodeContext(lines, startIndex) {
  // Look for the next non-empty, non-comment line
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and regular comments
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue
    }
    
    // Check for class declaration
    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/)
    if (classMatch) {
      return { type: 'class', name: classMatch[1] }
    }
    
    // Check for function declaration
    const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
    if (functionMatch) {
      return { type: 'function', name: functionMatch[1] }
    }
    
    // Check for static method
    const staticMethodMatch = line.match(/static\s+(?:async\s+)?(\w+)\s*\(/)
    if (staticMethodMatch) {
      return { type: 'function', name: staticMethodMatch[1] }
    }
    
    // Check for arrow function or method
    const methodMatch = line.match(/(?:(?:const|let|var)\s+)?(\w+)\s*[:=]\s*(?:async\s*)?\(/) || 
                       line.match(/(\w+)\s*\(.*\)\s*[:{]/)
    if (methodMatch) {
      return { type: 'function', name: methodMatch[1] }
    }
    
    // Check for variable/constant declaration
    const varMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)/)
    if (varMatch) {
      return { type: 'variable', name: varMatch[1] }
    }
    
    // If we found some code but couldn't categorize it, stop looking
    break
  }
  
  return null
}

/// Recursively find all source files in a directory
/// @param dir - Directory path to search
/// @returns Array of file paths with supported extensions
function findSourceFiles(dir) {
  const files = []
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(entry.name))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

/// Generate markdown documentation from parsed comments
/// @param allComments - Array of parsed documentation objects
/// @param sourceDir - Source directory path for reference
/// @returns Generated markdown content as string
function generateMarkdown(allComments, sourceDir) {
  let markdown = `# Documentation\n\n`
  
  // Group comments by topics, classes, functions, variables, and general
  const topics = []
  const classes = []
  const functions = []
  const variables = []
  const general = []
  
  for (const comment of allComments) {
    if (comment.topic || (comment.detectedType === 'topic')) {
      topics.push(comment)
    } else if (comment.class || (comment.detectedType === 'class')) {
      classes.push(comment)
    } else if (comment.function || (comment.detectedType === 'function')) {
      functions.push(comment)
    } else if (comment.detectedType === 'variable') {
      variables.push(comment)
    } else {
      general.push(comment)
    }
  }
  
  // Generate topics section
  if (topics.length > 0) {
    for (const topic of topics) {
      const name = topic.topic || topic.detectedName || 'Unknown Topic'
      markdown += `## Topic: ${name}\n\n`
      if (topic.description.length > 0) {
        markdown += `${topic.description.join(' ')}\n\n`
      }
    }
  }
  
  // Generate classes section with bundled functions
  if (classes.length > 0) {
    for (const cls of classes) {
      const className = cls.class || cls.detectedName || 'Unknown Class'
      markdown += `## Class: ${className}\n\n`
      if (cls.description.length > 0) {
        markdown += `${cls.description.join(' ')}\n\n`
      }
      
      // Find functions that belong to this class and group them
      const classFunctions = functions.filter(func => {
        // Simple heuristic: if function has no explicit class association, 
        // assume it belongs to the most recently defined class
        return true // For now, include all functions under the class
      })
      
      // Add functions as subsections under the class
      for (const func of classFunctions) {
        const funcName = func.function || func.detectedName || 'Unknown Function'
        markdown += `---\n\n### ${funcName}\n\n`
        if (func.description.length > 0) {
          markdown += `**About:** ${func.description.join(' ')}\n\n`
        }
        if (func.params.length > 0) {
          const paramNames = func.params.map(p => p.split(' - ')[0]).join(', ')
          markdown += `**Parameters:** ${paramNames}\n\n`
        }
        if (func.returns) {
          markdown += `**Returns:** ${func.returns}\n\n`
        }
      }
    }
  } else if (functions.length > 0) {
    // If no classes, show functions at top level
    markdown += `## Functions\n\n`
    for (const func of functions) {
      const funcName = func.function || func.detectedName || 'Unknown Function'
      markdown += `---\n\n### ${funcName}\n\n`
      if (func.description.length > 0) {
        markdown += `**About:** ${func.description.join(' ')}\n\n`
      }
      if (func.params.length > 0) {
        const paramNames = func.params.map(p => p.split(' - ')[0]).join(', ')
        markdown += `**Parameters:** ${paramNames}\n\n`
      }
      if (func.returns) {
        markdown += `**Returns:** ${func.returns}\n\n`
      }
    }
  }
  
  // Generate variables section
  if (variables.length > 0) {
    markdown += `## Variables\n\n`
    for (const variable of variables) {
      const name = variable.detectedName || 'Unknown Variable'
      markdown += `---\n\n### ${name}\n\n`
      if (variable.description.length > 0) {
        markdown += `**About:** ${variable.description.join(' ')}\n\n`
      }
      if (variable.returns) {
        markdown += `**Type:** ${variable.returns}\n\n`
      }
    }
  }
  
  // Generate general documentation
  if (general.length > 0) {
    markdown += `## General\n\n`
    for (const doc of general) {
      if (doc.description.length > 0) {
        markdown += `${doc.description.join(' ')}\n\n`
      }
      if (doc.params.length > 0) {
        const paramNames = doc.params.map(p => p.split(' - ')[0]).join(', ')
        markdown += `**Parameters:** ${paramNames}\n\n`
      }
      if (doc.returns) {
        markdown += `**Returns:** ${doc.returns}\n\n`
      }
    }
  }
  
  return markdown
}

/// Main function
/// Processes command line arguments and generates documentation
function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.error('Usage: node doc-generator/generator.js <source-dir> <output-dir>')
    console.error('Example: node doc-generator/generator.js packages/knowledge/src packages/knowledge/docs')
    console.error('Note: Uses triple slash comments (///) for documentation extraction')
    process.exit(1)
  }
  
  const [sourceDir, outputDir] = args
  
  // Validate source directory
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`)
    process.exit(1)
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log(`Created output directory: ${outputDir}`)
  }
  
  // Find all source files
  const sourceFiles = findSourceFiles(sourceDir)
  console.log(`Found ${sourceFiles.length} source files`)
  
  // Extract documentation from all files
  const allComments = []
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const comments = extractTripleSlashComments(content)
    
    if (comments.length > 0) {
      console.log(`Extracted ${comments.length} documentation blocks from ${path.relative(sourceDir, file)}`)
      allComments.push(...comments)
    }
  }
  
  if (allComments.length === 0) {
    console.log('No triple slash comments found in source files')
    return
  }
  
  // Generate markdown
  const markdown = generateMarkdown(allComments, sourceDir)
  
  // Write to index.md
  const outputFile = path.join(outputDir, 'index.md')
  fs.writeFileSync(outputFile, markdown)
  
  console.log(`Documentation generated: ${outputFile}`)
  console.log(`Total documentation blocks processed: ${allComments.length}`)
}

/// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}