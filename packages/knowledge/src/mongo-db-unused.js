import { uuidv7 } from 'uuidv7'
import { Logger } from './logger.js'
import { Perms } from './perms.js'
import { MongoClient } from 'mongodb'

// Initialize MongoDB connection and store on bus
async function initMongo(bus) {
  if (bus._database_bindings?.mongo) return bus._database_bindings.mongo // Already initialized
  
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const mongoDb = process.env.MONGODB_NAME || 'social-appliance'
    const mongoCollection = process.env.MONGODB_COLLECTION || 'entities'
    
	Logger.info("Connecting to mongo",{mongoUrl, mongoDb, mongoCollection})

    const client = new MongoClient(mongoUrl)
    await client.connect()
    const db = client.db(mongoDb)
    const collection = db.collection(mongoCollection)
    
    // Check if we should flush the database
    const shouldFlushDb = process.env.MONGODB_FLUSH === 'true' || process.env.MONGODB_FLUSH === '1'
    
    if (shouldFlushDb) {
      const deleteResult = await collection.deleteMany({})
      Logger.info(`🗑️  MONGODB_FLUSH: Deleted ${deleteResult.deletedCount} documents from MongoDB collection`)
    }
    
    // Create index for efficient lookups
    await collection.createIndex({ id: 1 }, { unique: true })
    await collection.createIndex({ type: 1 })
    
    // Store connection details on the bus
    if (!bus._database_bindings) {
      bus._database_bindings = {}
    }
    bus._database_bindings.mongo = { db, collection, client }
    
    Logger.info(`🗄️ Connected to MongoDB: ${mongoUrl}/${mongoDb}/${mongoCollection}`)
    return bus._database_bindings.mongo
  } catch (error) {
	console.error('Failed to connect to mongo',error)
    Logger.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v)

function mergeDeep(target, overlay={}) {
  for (const [k, v] of Object.entries(overlay || {})) {
    if (v === undefined) {
      delete target[k]
    } else {
	  target[k] = isObj(v) ? mergeDeep(isObj(target[k]) ? target[k] : {}, v) : v
	}
  }
  return target
}

// Convert MongoDB query to match the same pattern as volatile-db
function buildMongoQuery(query) {
  // Convert nested object queries to MongoDB dot notation
  const mongoQuery = {}
  
  function flattenQuery(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flattenQuery(value, fullKey)
      } else {
        mongoQuery[fullKey] = value
      }
    }
  }
  
  flattenQuery(query)
  return mongoQuery
}

export const mongo_query = {
	meta: {title:"mongo_query"},
	on_entity: {
		filter: 'query',
		resolve: async (blob, bus)=>{
			const { collection } = await initMongo(bus)
			
			// Extract pagination parameters and exclude from actual query
			const { limit, offset, ...actualQuery } = blob.query
			
			const mongoQuery = buildMongoQuery(actualQuery)

			console.log("******* server looking for",mongoQuery)

			let queryBuilder = collection.find(mongoQuery)
			
			// Apply pagination if provided
			if (offset && parseInt(offset) > 0) {
				queryBuilder = queryBuilder.skip(parseInt(offset))
			}
			if (limit && parseInt(limit) > 0) {
				queryBuilder = queryBuilder.limit(parseInt(limit))
			}
			
			const candidates = await queryBuilder.toArray()
			
			Logger.info(`🔍 MongoDB query found ${candidates.length} results`)
			return candidates
		}
	}
}

export const mongo_db = {
	meta: {title:"mongo_db"},
	on_entity: {
		priority: 998, // Slightly earlier priority than volatile_db so it runs before
		filter: 'id',
		resolve: async (blob, bus)=>{
			const { collection } = await initMongo(bus)

			// paranoia check
			if(!blob.hasOwnProperty('id')) {
				Logger.error('no id present')
				return
			}

			// passing 0, null or "" indicates a desire to generate a new id identifier
			if(!blob.id || !blob.id.length) {
				blob.id = `${uuidv7()}`
			}

			// obliterate?
			if(blob.obliterate) {
				const result = await collection.deleteOne({ id: blob.id })
				if (result.deletedCount > 0) {
					Logger.info(`🗑️  Deleted entity ${blob.id} from MongoDB`)
				}
				return
			}

			const existing = await collection.findOne({ id: blob.id })

			// check if write perms here
			if(!Perms.write(blob,existing)) {
				Logger.error('no write perms',blob,existing)
				return
			}

			// create or extend - properties can be deleted by setting them to undefined
			if(existing) {
				// Merge with existing document
				const merged = mergeDeep({...existing}, blob)
				
				// Remove undefined fields (MongoDB doesn't like them)
				const cleanDoc = JSON.parse(JSON.stringify(merged))
				
				// Remove the _id field to avoid MongoDB immutable field error
				delete cleanDoc._id
				
				await collection.replaceOne({ id: blob.id }, cleanDoc)
				Logger.info(`📝 Updated entity ${blob.id} in MongoDB`)
			} else {
				// Clean the document before inserting
				const cleanDoc = JSON.parse(JSON.stringify(blob))
				
				await collection.insertOne(cleanDoc)
				Logger.info(`💾 Created entity ${blob.id} in MongoDB`)
			}
		}
	}
}
