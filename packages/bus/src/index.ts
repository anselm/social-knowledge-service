/*
import {Logger} from '@social/logger'

const on_entity_register = {
	meta: {title:"on_entity register"},
	on_entity: async (blob) => {
		// register on_entity handlers
		if(!blob.on_entity) return
		// do not register twice sanity check
		if(observers.includes(blob)) return
		// allow splice insert optionally
		if(blob.on_entity.hasOwnProperty('priority')) {
			observers.splice(blob.on_entity.priority,0,blob)
		} else {
			observers.push(blob)
		}
		Logger.log("... saving observer",blob)
	}
}

export class Bus {

	observers = [on_entity_register]

	async bus(blob) {
		// ignore?
		if(!blob || blob == null || blob === undefined) {
			Logger.error('blob is empty')
			return
		}
		// unroll arrays as a convenience
		if(Array.isArray(blob)) {
			for(let i = 0; i < blob.length; i++) {
				await(this.bus(blob[i]))
			}
			return
		}
		// by this point only handle objects
		if(typeof blob !== 'object') {
			Logger.error('blob is not an object')
			return
		}
		// pass to observers - exit early if any results
		const observers = this.observers
		for(let i = 0;i<observers.length;i++) {
			const observer = observers[i]
			if(observer.on_entity.filter && !blob.hasOwnProperty(observer.on_entity.filter)) continue
			const fn = observer.on_entity.resolve ? observer.on_entity.resolve : observer.on_entity
			const results = await fn(blob,sys)
			if(results) return results
		}
	}
}

*/



