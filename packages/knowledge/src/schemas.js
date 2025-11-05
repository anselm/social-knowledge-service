// Auto-generated schemas module - contains all JSON schemas as JavaScript objects
// This avoids file system access and __dirname issues in different environments

export const schemas = [
  {
    "$id": "ka://schemas/core/meta/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "meta",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Metadata on an entity - stuff miscellaneous common properties here",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "slug": { "type": "string", "description": "URL-safe identifier" },
      "label": { "type": "string", "description": "Human-readable label/title" },
      "content": { "type": "string", "description": "Primary body/notes (markdown ok)" },
      "depiction": { "type": "string", "format": "uri", "description": "Image URL" },
      "view": { "type": "string", "description": "Preferred UI/view hint" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "aliases": { "type": "array", "items": { "type": "string" } },
      "provenance": { "type": "string" },
      "created": { "type": "string", "format": "date-time" },
      "updated": { "type": "string", "format": "date-time" },
      "creatorAddress": {
        "type": "string",
        "description": "Address or identifier of the user who created this entity (from SIWE or Magic.link)"
      },
      "permissions": {
        "type": "string",
        "enum": ["private", "protected", "public", "append"],
        "description": "Visibility and permissions level of this entity"
      },
      "props": { "type": "object", "description": "Freeform space", "additionalProperties": true }
    }
  },

  {
    "$id": "ka://schemas/core/time/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "time",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Temporal phenomenon with optional start/end",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "begins": { "type": "string", "format": "date-time" },
      "ends": { "type": "string", "format": "date-time" },
      "duration": { "type": "string", "description": "ISO 8601 duration (e.g., P3D, PT2H)" }
    }
  },

  {
    "$id": "ka://schemas/core/location/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "location",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Geographic location with coordinates and address",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "point": {
        "type": "object",
        "description": "GeoJSON Point geometry",
        "required": ["type", "coordinates"],
        "properties": {
          "type": { "const": "Point" },
          "coordinates": {
            "type": "array",
            "items": { "type": "number" },
            "minItems": 2,
            "maxItems": 3,
            "description": "[longitude, latitude, elevation?]"
          }
        }
      },
      "address": { "$ref": "ka://schemas/core/address/1.0.0" }
    }
  },

  {
    "$id": "ka://schemas/core/address/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "address",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Physical or postal address",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "streetAddress": { "type": "string" },
      "addressLocality": { "type": "string", "description": "City" },
      "addressRegion": { "type": "string", "description": "State/Province" },
      "postalCode": { "type": "string" },
      "addressCountry": { "type": "string" }
    }
  },

  {
    "$id": "ka://schemas/core/stats/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "stats",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Statistical metrics about an entity",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "observers": { "type": "number", "description": "Number following/watching this entity" },
      "children": { "type": "number", "description": "Number of child entities" },
      "reputation": { "type": "number", "description": "Quality/trust score" },
      "weight": { "type": "number", "description": "Relative importance/priority" }
    }
  },

  {
    "$id": "ka://schemas/core/relation/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "relation",
    "namespace": "core",
    "version": "1.0.0",
    "description": "COMPONENT: Relationship between entities",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "kind": { "type": "string", "description": "Type of relationship (contains, follows, etc.)" },
      "source": { "type": "string", "description": "Source entity ID" },
      "target": { "type": "string", "description": "Target entity ID" },
      "strength": { "type": "number", "minimum": 0, "maximum": 1, "description": "Relationship strength (0-1)" }
    }
  },

  {
    "$id": "ka://schemas/core/thing/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "thing",
    "namespace": "core",
    "version": "1.0.0",
    "description": "ENTITY: A generic thing or object",
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "meta"],
    "properties": {
      "id": { "type": "string" },
      "kind": { "const": "thing", "description": "A thing entity" },
      "meta": { "$ref": "ka://schemas/core/meta/1.0.0" },
      "time": { "$ref": "ka://schemas/core/time/1.0.0" },
      "location": { "$ref": "ka://schemas/core/location/1.0.0" },
      "stats": { "$ref": "ka://schemas/core/stats/1.0.0" }
    }
  },

  {
    "$id": "ka://schemas/core/party/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "party",
    "namespace": "core",
    "version": "1.0.0",
    "description": "ENTITY: A person, organization, or agent",
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "meta"],
    "properties": {
      "id": { "type": "string" },
      "kind": { "const": "party", "description": "A party entity" },
      "meta": { "$ref": "ka://schemas/core/meta/1.0.0" },
      "time": { "$ref": "ka://schemas/core/time/1.0.0" },
      "location": { "$ref": "ka://schemas/core/location/1.0.0" },
      "stats": { "$ref": "ka://schemas/core/stats/1.0.0" }
    }
  },

  {
    "$id": "ka://schemas/core/group/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "group",
    "namespace": "core",
    "version": "1.0.0",
    "description": "ENTITY: A collection or grouping of other entities",
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "meta"],
    "properties": {
      "id": { "type": "string" },
      "kind": { "const": "group", "description": "A group entity" },
      "meta": { "$ref": "ka://schemas/core/meta/1.0.0" },
      "time": { "$ref": "ka://schemas/core/time/1.0.0" },
      "location": { "$ref": "ka://schemas/core/location/1.0.0" },
      "stats": { "$ref": "ka://schemas/core/stats/1.0.0" }
    }
  },

  {
    "$id": "ka://schemas/core/edge/1.0.0",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name": "edge",
    "namespace": "core",
    "version": "1.0.0",
    "description": "ENTITY: A relationship/edge between two other entities",
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "meta"],
    "properties": {
      "id": { "type": "string" },
      "kind": { "const": "edge", "description": "An edge entity between two other entities" },
      "meta": { "$ref": "ka://schemas/core/meta/1.0.0" },
      "time": { "$ref": "ka://schemas/core/time/1.0.0" },
      "relation": { "$ref": "ka://schemas/core/relation/1.0.0" }
    }
  }
];