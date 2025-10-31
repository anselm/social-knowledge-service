import { Logger } from '../utils/logger.js'

const slug = "orbital/sys/load"
const title = "loader"
const description = `Load component loads other assets on demand`

export const isServer = (typeof window === 'undefined') ? true : false
export const cwd = (typeof process === 'undefined') ? "" : process.cwd()

//
// harmonization of paths
//
// there are some challenges in resolving imports
//
//		- users may indicate an absolute resource such as 'https://something.com/something.js'
//		- it's convenient for users to indicate relative paths such as ./myasset.js or ../myasset.js
//		- and also users may want to indicate paths associated with import maps such as 'orbital/something.js'
//		- users may wish to specify '/someasset' - although that breaks path relative apps - disallow?
//		- users may wish to even compose paths out in a way that looks like /someasset/thing.js/../otherthing.js'
//		- because this loader itself may come from jsdelivr or somewhere, its own import.meta.url is not useful
//		- a user could supply an 'anchor' to ground any relative requests however
//		- import maps as a whole are badly designed conceptually by the people who defined them
//		- import maps cannot be altered late; and cannot be rewritten or browsed
//		- import maps don't work on servers, creating an inconsistent behavior
//		- on a server the cwd does imply the root of the server operation and we want to prevent escaping that frame
//

const harmonize_resource_path = (scope,blob,resource) => {

	// @todo this could be made configurable dynamically
	if(!scope._loader_config) {
		scope._loader_config = {
			index:'index.js',
			importmaps: {
			},
			anchor:""
		}
	}
	const config = scope._loader_config

	// disallow unrecognized or too short
	if (!resource || typeof resource !== 'string' && !(resource instanceof String) || resource.length < 1) {
		return null
	}

	// disallow supporting /filename for now completely
	if(resource[0]=='/') {
		err(uuid,'not portable to start a resource at an absolute path',resource)
		return null
	}

	// allow importing of urls as is
	const lower = resource.toLowerCase()
	if( lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('file://') ) {
		return resource
	}

	// callers may want to inject an anchor for future use generally; as kind of a poor mans importmap
	if(blob.anchor) config.anchor = blob.anchor
	let anchor = config.anchor

	// non relative files are import maps - the anchor must be ignored - import() is responsible for these
	if(resource[0]!='.') {
		return resource
	}

	// composit the file and the anchor - URL will strip "../../" and generate a canonical path
	if(!isServer) {
		const url = new URL(resource,anchor)
		return url
	}

	// server with anchor - no safety checks @todo prevent escaping the root folder of cwd()
	return anchor + resource

}

const resolve = async function(blob,bus) {

	// sanity check
	if(!blob || !blob.load) return

	// deal with a string or array of strings of files to load
	let candidates = []
	if(Array.isArray(blob.load)) {
		candidates = blob.load
	} else if(typeof blob.load === 'string' || blob.load instanceof String) {
		candidates = [blob.load]
	} else {
		err(uuid,'unsupported type',blob)
		return
	}

	// build a list of found artifacts by loading the candidate files now
	const found = []
	for(let candidate of candidates) {

		// have to do some work to tidy up real path
		const resource = harmonize_resource_path(bus,blob,candidate)
		if(!resource) {
			continue
		}

		// only visit a file once ever - stash visited into bus as a slight hack - local per instance of bus
		// @todo think of a way to store _loader_visited somewhere else 
		if(!bus._loader_visited) sys._loader_visited = {}
		if(bus._loader_visited[resource]) {
			Logger.warn('already attempted to load once',resource)
			continue
		}
		bus._loader_visited[resource] = resource

		// mark found objects with the resource path - dealing with returned array collections
		const inject_metadata = (key,item) => {
			if(!item) {
				Logger.err(uuid,'corrupt exports',key)
			} else if(Array.isArray(null,item)) {
				item.forEach( inject_metadata )
			} else if(typeof item === 'object') {
				item._metadata = { key, anchor:resource }
			}
		}

		// load all objects
		try {
			Logger.warn("loading",resource)
			const module = await import(resource)
			for(const [k,v] of Object.entries(module)) {
				inject_metadata(k,v)
				found.push(v)
			}
		} catch(e) {
			Logger.err('unable to load',e)
		}

	}

	// produce these objects
	bus.bus(found)
}

///
/// loader
///
/// given an object of the form { load: ["filename.js"] }
/// load objects in as if they were bus events
///

export const loader = {
	meta: {slug,title,description},
	on_entity: { filter: 'load', resolve }
}
