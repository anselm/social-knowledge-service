import { Logger } from '@social/logger';
// Type guard to check if on_entity is a config object with properties
function isOnEntityConfig(onEntity) {
    return 'filter' in onEntity || 'resolve' in onEntity || 'priority' in onEntity;
}
// @todo debate: could use a richer constructor so that i can have this.observers?
const on_entity_register = {
    meta: { title: "on_entity register" },
    on_entity: async (blob, bus) => {
        // register on_entity handlers
        if (!blob.on_entity)
            return;
        // do not register twice sanity check
        if (bus.observers.includes(blob))
            return;
        // allow splice insert optionally
        if (blob.on_entity.hasOwnProperty('priority')) {
            bus.observers.splice(blob.on_entity.priority, 0, blob);
        }
        else {
            bus.observers.push(blob);
        }
        Logger.log("... saving observer", blob);
    }
};
export class Bus {
    // @todo put in the observer?
    observers = [on_entity_register];
    async bus(blob) {
        // ignore?
        if (!blob || blob == null || blob === undefined) {
            Logger.error('blob is empty');
            return;
        }
        // unroll arrays as a convenience
        if (Array.isArray(blob)) {
            for (let i = 0; i < blob.length; i++) {
                await (this.bus(blob[i]));
            }
            return;
        }
        // by this point only handle objects
        if (typeof blob !== 'object') {
            Logger.error('blob is not an object');
            return;
        }
        // @todo maybe this could be inside the observer
        // pass to observers - exit early if any results
        const observers = this.observers;
        for (let i = 0; i < observers.length; i++) {
            const observer = observers[i];
            if (!observer)
                continue;
            const onEntity = observer.on_entity;
            // Check if on_entity has a filter property (it's a config object)
            if (isOnEntityConfig(onEntity) && onEntity.filter) {
                if (!blob.hasOwnProperty(onEntity.filter))
                    continue;
            }
            // Determine the function to call
            const fn = (isOnEntityConfig(onEntity) && onEntity.resolve)
                ? onEntity.resolve
                : onEntity;
            const results = await fn(blob, this);
            if (results)
                return results;
        }
    }
}
