import { uuidv7 } from 'uuidv7'
import { Logger } from '@social/logger'
import { Perms } from './perms.js'

const entities = {}
const entity_values = []

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

function matchesDeep(obj, query) {
  return Object.entries(query).every(([key, value]) => {
    if (!(key in obj)) return false
    const targetVal = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return matchesDeep(targetVal, value)
    } else {
      return targetVal === value;
    }
  })
}

export const query = {
	meta: {title:"query"},
	on_entity: {
		filter: 'query',
		resolve: async (blob)=>{
			const candidates = entity_values.filter(obj => matchesDeep(obj, blob.query))
			return candidates
		}
	}
}

export const volatile_db = {
	meta: {title:"volatile_db"},
	on_entity: {
		priority: 999,
		filter: 'kid',
		resolve: async (blob,sys)=>{

			// paranoia check
			if(!blob.hasOwnProperty('kid')) {
				Logger.error('no kid present')
				return
			}

			// passing 0, null or "" indicates a desire to generate a new kid identifier
			if(!blob.kid || !blob.kid.length) {
				blob.kid = `${uuidv7()}`
			}

			// obliterate?
			if(blob.obliterate) {
				const prev = entities[blob.key]
				if(!prev) return
				delete entities[prev.key]
				let i = entity_values.indexOf(prev)
				if(i < 0) return // this shouldn't happen
				entity_values.splice(i,1)
				return
			}

			const existing = entities[blob.kid]

			// check if write perms here
			if(!Perms.write(blob,existing)) {
				Logger.error('no write perms',blob,existing)
				return
			}

			// slugs - @todo - disallow writing over if you don't have perms at the very least, maybe prevent kid conflict

			// create or extend - properties can be deleted by setting them to undefined
			if(existing) {
				mergeDeep(existing,blob)
				//Logger.log("stored entity merge",blob)
			} else {
				entities[blob.kid]=blob
				entity_values.push(blob) // convenience to avoid Object.values(entities)
				//Logger.log("stored entity",blob)
			}
		}
	}
}


