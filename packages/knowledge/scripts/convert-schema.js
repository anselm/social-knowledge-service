#!/usr/bin/env node

/**
 * Schema Conversion Script
 * 
 * Converts old-style seed data to new component-based schema format.
 * 
 * Old format:
 * - Flat properties like title, content, latitude, longitude, etc.
 * - parentId for hierarchical relationships
 * 
 * New format: 
 * - Component-based: meta, location, stats, time, etc.
 * - Relations stored separately (no more parentId)
 * - GeoJSON Point format for spatial data
 */

import fs from 'fs';
import path from 'path';

/**
 * Convert old entity format to new component-based format
 */
function convertEntity(entity) {
  const converted = {
    id: entity.id,
    kind: entity.type || 'thing' // Default to 'thing' if no type
  };

  // Build meta component
  const meta = {
    slug: entity.slug,
    permissions: 'public' // Default permission
  };

  // Map old fields to meta component
  if (entity.title) meta.label = entity.title;
  if (entity.content) meta.content = entity.content;
  if (entity.view) meta.view = entity.view;
  if (entity.depiction) meta.depiction = entity.depiction;
  if (entity.tags) meta.tags = entity.tags;
  if (entity.aliases) meta.aliases = entity.aliases;
  if (entity.provenance) meta.provenance = entity.provenance;
  if (entity.createdAt) meta.created = entity.createdAt;
  if (entity.updatedAt) meta.updated = entity.updatedAt;
  if (entity.creatorAddress) meta.creatorAddress = entity.creatorAddress;

  // Handle props (freeform data)
  const props = {};
  if (entity.sponsorId) props.sponsorId = entity.sponsorId;
  if (entity.memberCount) props.memberCount = entity.memberCount;
  if (entity.recentPosts) props.recentPosts = entity.recentPosts;
  if (entity.isPublic !== undefined) props.isPublic = entity.isPublic;
  if (entity.metadata) Object.assign(props, entity.metadata);
  
  if (Object.keys(props).length > 0) {
    meta.props = props;
  }

  converted.meta = meta;

  // Build location component if geographic data exists
  if (entity.latitude !== undefined && entity.longitude !== undefined) {
    const location = {
      lat: entity.latitude,
      lon: entity.longitude
    };

    if (entity.altitude !== undefined) location.alt = entity.altitude;
    if (entity.radius !== undefined) location.rad = entity.radius;

    // Add GeoJSON Point for MongoDB spatial queries
    location.point = {
      type: 'Point',
      coordinates: [entity.longitude, entity.latitude] // [lon, lat] per GeoJSON spec
    };

    converted.location = location;
  }

  // Build stats component from metadata
  if (entity.metadata) {
    const stats = {};
    if (entity.metadata.memberCount) stats.observers = entity.metadata.memberCount;
    if (entity.metadata.recentPosts) stats.children = entity.metadata.recentPosts;
    if (entity.upvotes) stats.upvotes = entity.upvotes;
    if (entity.visited) stats.visited = entity.visited;
    if (entity.activity) stats.activity = entity.activity;
    if (entity.reputation) stats.reputation = entity.reputation;
    if (entity.distance) stats.distance = entity.distance;

    if (Object.keys(stats).length > 0) {
      converted.stats = stats;
    }
  }

  // Build time component if temporal data exists
  if (entity.begins || entity.ends || entity.duration) {
    const time = {};
    if (entity.begins) time.begins = entity.begins;
    if (entity.ends) time.ends = entity.ends;
    if (entity.duration) time.duration = entity.duration;
    converted.time = time;
  }

  // Build address component if address data exists
  if (entity.streetAddress || entity.city || entity.region) {
    const address = {};
    if (entity.streetAddress) address.streetAddress = entity.streetAddress;
    if (entity.city) address.city = entity.city;
    if (entity.region) address.region = entity.region;
    if (entity.postalCode) address.postalCode = entity.postalCode;
    if (entity.country) address.country = entity.country;
    if (entity.countryCode) address.countryCode = entity.countryCode;
    if (entity.admin1) address.admin1 = entity.admin1;
    if (entity.admin2) address.admin2 = entity.admin2;
    if (entity.iso_3166_2) address.iso_3166_2 = entity.iso_3166_2;
    converted.address = address;
  }

  return converted;
}

/**
 * Extract parent-child relationships from entities with parentId
 */
function extractRelations(entities) {
  const relations = [];
  
  entities.forEach(entity => {
    if (entity.parentId) {
      relations.push({
        id: `${entity.id}-parent-${entity.parentId}`,
        kind: 'edge',
        meta: {
          slug: `${entity.id}-parent-${entity.parentId}`,
          label: `${entity.id} is child of ${entity.parentId}`,
          created: entity.createdAt || new Date().toISOString(),
          updated: entity.updatedAt || new Date().toISOString(),
          permissions: 'public'
        },
        relation: {
          subject: entity.id,
          predicate: 'childOf',
          object: entity.parentId,
          rank: 0,
          weight: 1
        }
      });
    }
  });

  return relations;
}

/**
 * Convert a seed data file
 */
async function convertSeedFile(inputPath, outputPath) {
  console.log(`Converting ${inputPath} to ${outputPath}...`);

  // Dynamic import the old seed data
  const module = await import(inputPath);
  
  const convertedData = {};
  const allEntities = [];

  // Convert each export
  for (const [exportName, exportValue] of Object.entries(module)) {
    if (exportName === 'default') continue;

    console.log(`  Converting export: ${exportName}`);

    if (Array.isArray(exportValue)) {
      // Convert array of entities
      const converted = exportValue.map(convertEntity);
      convertedData[exportName] = converted;
      allEntities.push(...exportValue);
    } else if (exportValue && typeof exportValue === 'object' && exportValue.id) {
      // Convert single entity
      const converted = convertEntity(exportValue);
      convertedData[exportName] = converted;
      allEntities.push(exportValue);
    } else {
      // Keep non-entity exports as-is
      convertedData[exportName] = exportValue;
    }
  }

  // Extract relations from parentId fields
  const relations = extractRelations(allEntities);
  if (relations.length > 0) {
    convertedData.relations = relations;
    console.log(`  Extracted ${relations.length} parent-child relations`);
  }

  // Generate the new file content
  const fileContent = `// Auto-generated by schema conversion script
// Converted from old flat schema to new component-based schema

${Object.entries(convertedData).map(([name, value]) => 
  `export const ${name} = ${JSON.stringify(value, null, 2)};`
).join('\n\n')}
`;

  // Write the converted file
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`✅ Converted file written to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error('Usage: node convert-schema.js <input-file> [output-file]');
    console.error('Example: node convert-schema.js ./seed-data/berkeley/info.js ./seed-data/berkeley/info-new.js');
    process.exit(1);
  }

  const inputPath = path.resolve(inputFile);
  const outputPath = outputFile ? path.resolve(outputFile) : inputPath.replace('.js', '-converted.js');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    await convertSeedFile(`file://${inputPath}`, outputPath);
    console.log('🎉 Schema conversion completed successfully!');
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { convertEntity, extractRelations, convertSeedFile };