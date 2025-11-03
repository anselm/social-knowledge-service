import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Logger } from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/// JSON Schema validation manager using AJV
class SchemaManager {
  constructor() {
    this.ajv = new Ajv({
      strict: false,
      allErrors: true,
      verbose: true,
      validateSchema: false  // Disable meta-schema validation for now
    })
    
    // Add format validation support
    addFormats(this.ajv)
    
    this.schemas = new Map()
    this.initialized = false
  }

  /// Initialize and load all schemas from the schemas directory
  /// @returns Promise<void>
  async initialize() {
    if (this.initialized) return
    
    try {
      // Load the base schemas file
      const schemasPath = resolve(__dirname, '../schemas/base-schemas.json')
      const schemasContent = readFileSync(schemasPath, 'utf8')
      
      // Parse the JSON file which contains multiple schema objects
      const schemas = this.parseMultipleSchemas(schemasContent)
      
      // Register each schema with AJV
      for (const schema of schemas) {
        this.addSchema(schema)
      }
      
      this.initialized = true
      Logger.info(`📋 Loaded ${schemas.length} JSON schemas with AJV`)
      
    } catch (error) {
      Logger.error('Failed to initialize schema manager:', error)
      throw error
    }
  }

  /// Parse multiple JSON schemas from a single file
  /// @param content - File content containing multiple JSON objects
  /// @returns Array of parsed schema objects
  parseMultipleSchemas(content) {
    const schemas = []
    
    // Split by lines and look for schema objects
    const lines = content.split('\n')
    let currentSchema = ''
    let braceCount = 0
    let inSchema = false
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue
      
      // Count braces to track JSON object boundaries
      for (const char of trimmed) {
        if (char === '{') {
          if (!inSchema) inSchema = true
          braceCount++
        } else if (char === '}') {
          braceCount--
        }
      }
      
      if (inSchema) {
        currentSchema += line + '\n'
        
        // If we've closed all braces, we have a complete schema
        if (braceCount === 0) {
          try {
            const schema = JSON.parse(currentSchema.trim())
            if (schema.$id) { // Only add objects that look like schemas
              schemas.push(schema)
            }
          } catch (e) {
            Logger.warn('Failed to parse schema object:', e.message)
          }
          
          currentSchema = ''
          inSchema = false
        }
      }
    }
    
    return schemas
  }

  /// Add a schema to AJV and store reference
  /// @param schema - JSON schema object with $id
  addSchema(schema) {
    if (!schema.$id) {
      throw new Error('Schema must have an $id property')
    }
    
    try {
      this.ajv.addSchema(schema)
      this.schemas.set(schema.name || schema.$id, schema)
      Logger.debug(`Added schema: ${schema.name || schema.$id}`)
    } catch (error) {
      Logger.error(`Failed to add schema ${schema.name || schema.$id}:`, error)
      throw error
    }
  }

  /// Validate data against a schema
  /// @param schemaId - Schema ID or name to validate against
  /// @param data - Data to validate
  /// @returns { valid: boolean, errors?: Array }
  validate(schemaId, data) {
    if (!this.initialized) {
      throw new Error('SchemaManager not initialized. Call initialize() first.')
    }
    
    try {
      const validate = this.ajv.getSchema(schemaId)
      
      if (!validate) {
        throw new Error(`Schema not found: ${schemaId}`)
      }
      
      const valid = validate(data)
      
      return {
        valid,
        errors: valid ? undefined : validate.errors
      }
    } catch (error) {
      Logger.error(`Validation error for schema ${schemaId}:`, error)
      return {
        valid: false,
        errors: [{ message: error.message }]
      }
    }
  }

  /// Get a compiled validation function for a schema
  /// @param schemaId - Schema ID or name
  /// @returns AJV validation function
  getValidator(schemaId) {
    if (!this.initialized) {
      throw new Error('SchemaManager not initialized. Call initialize() first.')
    }
    
    const validate = this.ajv.getSchema(schemaId)
    if (!validate) {
      throw new Error(`Schema not found: ${schemaId}`)
    }
    
    return validate
  }

  /// Get all loaded schema names/IDs
  /// @returns Array of schema identifiers
  getSchemaIds() {
    return Array.from(this.schemas.keys())
  }

  /// Get a schema by name or ID
  /// @param schemaId - Schema ID or name
  /// @returns Schema object or undefined
  getSchema(schemaId) {
    return this.schemas.get(schemaId)
  }
}

// Create singleton instance
const schemaManager = new SchemaManager()

export { SchemaManager, schemaManager }