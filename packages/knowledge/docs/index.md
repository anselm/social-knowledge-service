# Documentation

## Class: Knowledge

Knowledge API Allows loading/saving/querying a concrete collection of stereotypical social artifacts

---

### addEntity

**About:** Create or update an entity

**Parameters:** entity

**Returns:** Promise<void>

---

### queryEntities

**About:** Query entities with optional filters

**Parameters:** query

**Returns:** Promise<any[]> - Array of matching entities

---

### getEntityBySlug

**About:** Get an entity by its unique slug

**Parameters:** slug

**Returns:** Promise<any | null> - The entity or null if not found

---

### getEntityById

**About:** Get an entity by its id (unique ID)

**Parameters:** id

**Returns:** Promise<any | null> - The entity or null if not found

---

### updateEntity

**About:** Update an entity by id

**Parameters:** id, updates

**Returns:** Promise<void>

