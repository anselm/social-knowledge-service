# Social Knowledge Server

Nov 2 2025 @anselm

## Goal

- to provide a concrete knowledge server over common social types of artifacts (people, places, things, events).

- define what the artifacts are we intend to support

- define each artifact with a schema, probably compositionally out of related components

- define how to store schemas and submit new schemas

- define query support - we will be doing range queries for location and time as well as limit and offset and filtering for objects that are not visible to a given caller.

- define relationships between objects.

- use a compositional rather than class based approach

- think about remapping from one schema to another (lower priority)

- leverage schema.org, graphql and existing tooling

- Have a reserved namespace of top level compositional names

## Motivations

In our daily lives we exchange a variety of digital artifacts with other people representing concepts such as messages, events, people, places, things. But our software tools don't have a similar flexibility; our tools often only deal with one kind of concept - an email client for example doesn't put its data in a place that is visible to anything else. By providing a common or universal backend over a fixed set of objects it becomes easier for new applications to share state. The intended use is a universal backend with pre-defined types and schemas for a variety of projects such as a social network, a personal digital memory, groupware type applications such as a cms or portfolio website.

## Entities

For now these are the artifacts, entities or objects we think are meaningful; concepts that people deal with daily:

- parties - such as contacts, friends, peers, clients, prospects, pets, even corporations or ai's
- places - favorite places, places you want to go...
- things - assets, other artifacts
- events - such as calendar events you've scheduled, life events, world events
- messages - emails, smses, phone, telegram, signal, whatsapp, messenger and so on
- social media posts - facebook, linkedin, mastadon, bluesky
- media - articles, books, websites, rich media, photos, songs, playlists
- receipts - bills, invoices, obligations, crypto tokens, intents
- collections - groups, tags, folders, projects
- relationships - created, destroyed, owns, borrowed, friends, follows, favorite, vouch

There could be other concepts that are important may revisit these:

- agents (independent software agents)
- challenges, bids, rewards (brokerages)

## What are existing colloqiual representations of objects?

How do we as people already tend to try to represent or think about objects colloquially? What are the "top level" representations we use for concepts? This is important because it is the interface we present to users - users create objects in their own terms, and get back objects in their own terms.

**Properties**. One casual observation is that the objects in our lives can be conceptually viewed as a bags of properties. Lakoff talks about an idea of prototypical objects, and object oriented programming and classical database design talk about formal schemas, where there is an abstract representation of a "type". Either way - instance of things seem to be often usefully defined in terms of their properties.

**Kind**. Another observation is that objects (in colloquial human terms) tend to be placed into types, kinds or categories, for example my volvo is a car, a means of transportation, an expense. The idea of 'car' seems central, and perhaps there is a primary category. We seem to categorize by utility.

**Relations**. It is worth noting that we tend to conceptually have the relationships on an object as a property of the object.

Here are some examples instances of colliqual representations of objects:

```
{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e235
	kind: email, message, digital,
	title: where did the cookies go?
	sponsor: [janelle]
	targets: [you]
	content: here is a picture of an empty cookie plate, notice something missing?
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e236
	kind: group
	title: the hiking group discussion
	where: some server somewhere?
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e237
	kind: post
	title: about hiking
	where: 0199f025-c75d-73f5-b193-7eea5cc8e236
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e238
	kind: person, party, human, physical
	title: ramone steadway
	address: 1234 mlk drive
	phone number: +1(555)1212
	relationship: friend
	about: musician, trouble-maker, creative
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e239
	kind: event, temporal
	what: a wedding!
	where: at the top of [prospect park]
	when: yesterday at noon
	who: [john], [mary], [raoul], [teddy]
	duration: 4 hours
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e240
	kind: place, location, venue, office
	title: apple hq
	address: 1 infinity drive, [santa clara]
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e241
	kind: drink, food, safe, 
	amount: 12 ounces
	where: in the [fridge] -> could be a link to another object
}

{
	id: 0199f025-c75d-73f5-b193-7eea5cc8e243
	kind: receipt, paper, physical
	amount: 12 dollars
}

```

### Conceits of categorization - irreconcilable issues:

'Knowledge Graph' is bandied about as a panacea for data organization problems, but there are fundamental and deep irreconcilable issues in categorization of knowledge as a whole. There is no one true way to categorize or organize reality, and people in fact go mad trying to pursue that chimeral fantasy.

The actual physical world is a single seamless whole; the computer I am typing on, the table that computer rests on, the ground under that computer, that same ground under your feet, the device you are reading this on - are from some perspectives best categorized as a single system. An alien would not necessarily partition these artifacts as separate in the same way we do. In fact all of our partitioning schemes are ultimately arbitrary, to roughly model reality such that we can do basic reasoning and prediction. I recall reading (probably in an essay by Eleanor Rosch or George Lakoff) that the cartographic portage routes that native indians in Ontario used for wayfinding were so substantially alien to early european settlers that they simply couldn't understand them - natives were combining land and water into single routes that made sense to them but were difficult for people acclimitized to different partioning schemes.

Software developers are often amateur systems designers, philosophers or ontologists - we are often asked to build models of systems, and often have to devise some kind of "good enough" partitioning (usually on a budget and short time frame) to capture or represent a given topic space.

In the west we have a history of partitioning using directed acyclic graphs; such as separating flora and fauna (as per Aristotle). The problem with any disjoint partitioning scheme is that it is always based on incomplete information. The platypus feels like a strange creature to us, even though it is perfectly normal. It lays eggs and has a cloaca, so it has bird-like traits yet phylogenetics place it in our clade of mammals.

Folk classification schemes, such as tagging or voluntary categorization, are in fact used more often by lay persons than object oriented schemes that we often use as database designers or developers.

As developers we tend to try to be reasonably flexible, there's been work on prototype based categorization for example. Mongodb and other document centric datastores do help break out of the property or schema driven table based categorization - but even then that something even is a "thing" is itself questionable. Every attempt to label concepts will always just bring the boundary into relief, surfacing entities that straddle any attempt at division.

One general hint or way to think about "things" is to notice locally entangled knots or clusters of related ideas - and label those as a thing - although even then there is a risk that 'strong attractors' (very large nearby mountains of clustered concepts) can shadow or make it harder to distinguish the concept you're trying to illuminate. We are really just hitting caloric limits of reasoning. Another general hint is to just put time limits on partitioning effort; recognizing that it is in fact an unsolveable problem.

## What approaches have others tried to categorize information?

- Hundreds if not thousands of years of earlier history, cite categorization theory in general, Aristotle and so on [TBD]

- 1970 - Edgar F. Codd and the relational model (1970s): Codd's foundational work on the relational database model used formal schema concepts, organizing data into tables with predefined columns and rows and using a language (SQL) to interact with the data based on this structure.

- 1976 - Peter Chen and the Entity-Relationship (ER) model (1976): Chen's ER model became a standard for high-level database design. It introduced the familiar schema concepts of entities (persons, places) and relationships that connect them, forming the basis of many modern database schemas. 

- 1970s -  the terms 'knowledge database' and 'knowledge graph' apparently started to emerge in the 1970's - along with computer science as a whole. The [Knowledge Graph entry on Wikipedia](https://en.wikipedia.org/wiki/Knowledge_graph) mentions early work by an Austrian linguist Edgar Schneider along with the term "semantic network".

- 1989 - Tim Berners Lee (influenced by Ted Nelson) designed html and provided early thinking about a [semantic web](https://en.wikipedia.org/wiki/Semantic_Web) of relationships between rich data objects.

- 1995 - [The Dublin Core](https://en.wikipedia.org/wiki/Dublin_Core) was created in 1995 at a metadata workshop held in Dublin, Ohio. The initiative grew out of informal conversations in 1994 about the difficulty of finding resources on the web. The first workshop in March 1995 was co-hosted by the National Center for Supercomputing Applications (NCSA) and OCLC. It deserves special mention because it's an early example of a fully concrete formal schema that is also attempting to be general; to be a common core prefix for most "things". There's a "beefy base class" anti-pattern here; not all things have all properties - but in this case it feels reasonable to have some kind of agreed upon foundation to conceptually represent all things. We're very interested in _concrete_ pragmatic solutions.

- 2007 - Freebase

- 2007 - RDFa, OWL, JSONb. Laying the groundwork: Berners-Lee and others at the W3C developed foundational technologies for formal schemas, which are now core to modern linked data: Resource Description Framework (RDF): A standard model for data interchange that represents information as a series of subject-predicate-object triples. RDF Schema (RDFS) are a vocabulary for defining the classes and properties of RDF resources. Web Ontology Language (OWL) provides a richer vocabulary than RDFS for defining and describing the classes and properties of web resources. Ocean boiling stuff.

- 2010 - [JSON-LD](https://json-ld.org/learn/). (JavaScript Object Notation for Linked Data) was initially proposed by Manu Sporny in 2010 as part of the broader Linked Data effort. It was later adopted as a W3C Standard, with the JSON-LD 1.0 Recommendation being published on January 16, 2014.

- 2011 - ActivityStreams - a JSON-based data format that describes activities or events, the first version was published by the independent Activity Streams Working Group. 

- 2011 - [schema.org](https://schema.org) feels like a best efforts concrete effort at describing common everyday digital artifacts. Created by Google, Microsoft (Bing), Yahoo, Yandex to establish a common set of schemas for structured data markup on the web.

- 2012 - The Google Knowledge Graph is apparently used heavily by Google behind the scenes, it is a collection of instances of objects and schemas for them (heavily leveraging Freebase and other earlier work).

- 2012 - Wikidata is a free, multilingual database that serves as a central repository for structured data for the Wikimedia projects. 

- 2012 - GraphQL https://en.wikipedia.org/wiki/GraphQL GraphQL is a query language for APIs, developed by Facebook in 2012 and publicly released in 2015. Unlike traditional REST APIs, which expose multiple endpoints for different resources, GraphQL provides a single endpoint that allows clients to request exactly the data they need.

- 0000 - DOLCE (“Descriptive Ontology for Linguistic and Cognitive Engineering”)	Foundational / upper ontology	Compares very abstract categories (e.g. endurants vs perdurants, qualities, events) intended to model commonsense world structure. Rigorous and philosophically grounded. But heavy and abstract; not always easy to map down to application-level entities (e.g. “post,” “user”).

- 0000 - BFO / Other Foundational Ontologies	Upper ontologies	Very generic categories like continuants, occurrents, processes, objects, qualities, etc. (BFO = Basic Formal Ontology)	Good for integrating across domains (e.g. biology, medicine, engineering). But often seen as too coarse or abstract for everyday social web modelling.

- 0000 - SUMO / Cyc / OpenCyc	General common-sense / knowledge base ontology	Very broad coverage (physical objects, processes, relations, actions) with many axioms.	Huge and complex. Hard to work with at small scale; sometimes inconsistent or overly dense.

- 0000 - Ologs (Categorical Ontologies)	Category-theoretic / mathematical	A way to represent knowledge using category theory (objects, morphisms) in a rigorous, composable structure. Very elegant and theoretically appealing. But perhaps too abstract or formal for many applied systems unless the team is comfortable with category theory.

- 0000 - Gellish Semantic data-modeling / ontology language	A controlled natural language + ontology that merges taxonomy, relations, and formal semantics. 

- 0000 - LinkML Schema / modeling language with semantic underpinning	A way to define data schema (classes, properties) with semantics / reuse, bridging “pragmatic JSON / YAML” world with semantic web ideas. 

- Cite some modern ECS systems and prototype based categorization - tagging etc [TBD]

## Examining schema.org

- A successful, collaborative project by web ecosystem providers including Google, Microsoft, Yahoo, and Yandex - very much a top down effort, focused on pragmatic business needs.

- Provides a vocabulary of structured markup around concrete concepts: people, places and other artifacts including properties and possible relationships. See: https://schema.org/docs/full.html 

- Leverages JSON-LD in practice - see: https://json-ld.org/learn/

- Relevant to our data modeling effort in that schema.org is probably the best known well defined ontology with broad consensus.

- The original goal of schema.org appears to be modest: merely to help search engines better understand the content on web pages. By adding specific codes (often in the form of JSON-LD, Microdata, or RDFa) to a webpage, the page becomes more explicitly legible to machines - providing machine readable context to its elements. For example marking a specific part of a document as a "Recipe" or "Person," in theory allows search engines to search and filter better.

- Utility versus ontology: goal was apparently explicitly not to build a complete scientific ontology of the world, but to provide a practical vocabulary for describing things on the web. Its types and properties are driven by the needs of search engines to understand webpages, not by a deep philosophical or biological hierarchy or goal to classify possible thing in the world. For example the 'Person' type is a very common type of entity on the web, so it is treated as a first class concept. It is possible to decorate an entity with multiple types, so an entity can be of type person, author, reviewer, speaker, scientist - but 'Person' is a defacto norm.

- Uses a hierarchical approach, with a top-level class 'Thing' that all other types inherit properties from. Note that classical object categorization was popular at the time and is less popular today, today there's a tendency to use prototype based or Entity Control Systems style composition.

```
Thing
 └── CreativeWork
      └── Article
           └── BlogPosting
```

- Allows extensible schemas, for example a developer can introduce a schema to describe a platypus, as opposed to a person. More common schemas are already provides such as 'cat':

```
{
  "@context": "https://schema.org",
  "@type": "Cat",
  "name": "Thomas",
  "alternateName": "Tommy",
  "gender": "Male",
  "color": "Gray tabby",
  "breed": "Domestic Shorthair",
  "birthDate": "2018-04-15",
  "owner": {
    "@type": "Person",
    "name": "George"
  },
  "image": "https://example.com/photos/thomas.jpg",
  "url": "https://example.com/pets/thomas"
}
```

- Does leverage the Dublin Core - so that most schemas have the same core properties

- Note the use of '@'' which is idiomatic JSON-LD. An @id is a globally unique URL, and a @type is a well known schema.org type - basically the @ refers to reserved terms. The @context is a series of namespaces that has schemas for any given @type .

```
{
  "@context": {
    "schema": "https://schema.org/",
    "kat": "https://kat.yoursite.dev/"
  },
  "@type": ["schema:Thing", "kat:Cat"],
  "schema:name": "Thomas",
  "kat:colorPattern": "tabby"
}
```

## Examining GraphQL

[TBD]

## Introducing .info files -> declarative manifests

Supporting an idea of loading .info files or manifests and collections of declarative artifacts.

We allow users to use the filesystem to describe the files and assets they want to present, the filesystem maps 1-to-1 to the urls.

How it works:

- **URL Requests map to files and folders** - if a path is not found in the read-through client side cache, then we do an ordinary http request using es6 fetch (which is built into javacript today) to attempt to fetch a .info file on the matching path. A url request for "/hiking" will first attempt to resolve on the client side cache, but if not found then it will attempt to read through to the file-system using fetch("/hiking/.info.js") - noting that of course these are actually in "public/" because http requests are anchored on the public folder in svelte and other frameworks. These .info.js files can be kept in the root public folder or in child folders, and contain exports that are added to the database. The system is smart enough to never try to fetch "/hiking/.info.js" twice. Once we've attempted to fetch that once (given a cache miss) then we can try again - and while the request may still fail if no .info.js file is found, we've at least allowed an opportunity for the content creator to specify how to handle the request - effectively turning the filesystem into a database.

- **Preloading** - we always load the /.info.js file at startup. Any given .info.js can declare arbitrary objects, and this can help seed the state of the system. It's important to note that any freshly loaded .info.js will overwrite previously cached objects with matching ids.

- **Entity Declaration** - loading a .info.js file simply submits each exported object found in the file as an ordinary entity creation event. Illegal entities will still be rejected. Entities may need to have valid slugs for example.

- **Arrays** - The .info.js can consist of individual exports of objects, arrays of objects and/or default exports - all of which are treated as "entities to import".

- **js** - Note that we use .js instead of .json because it gives us more flexibility to dynamically compose exports.

- **tracing from root** - if our first request is for a child path such as /anselm/projects/2024 - we have to trace down from the root, first fetching /.info.js then /anselm/.info.js then /anselm/projects/.info.js and so on ... because we need to make sure we manufacture all objects 'in between' - rather than skipping to the leaf.

- **read through strategy** - If we're not in a serverless mode, then the read-through cache should always first try get the file at path/.info.js - because we may have a stub or partial content, then  try the client side state cache, and then if that all fails can go to the server if any... so the read through strategy should remain similar to before, except now we are shifting the reading of .info.js files to be dynamic rather than done once at the start...

- **hinting** - Because children won't be visible to the root, you'll often end up declaring content twice for now - later on let's introduce a dynamic load hint - so importing one .info.js can fetch some other related ones... 

**Example Directory structure**

```
client/public/data/
├── .info.js                    # Homepage content
├── anselm/
│   ├── projects/               # Development work
│   │   └── 2024/
│   │       └── project-name/
│   │           └── .info.js
│   ├── images/                 # Photography & visual work  
│   │   └── 2024/
│   │       └── photo-series/
│   │           └── .info.js
│   └── words/                  # Essays & writing
│       └── 2025/
│           └── essay-title/
│               └── .info.js
```

### Slugs

In keeping with the namespace parsing above an idea of /filesystem/like/paths is introduced as an optional way to label artifacts. This is a directed acyclic graph for local representation of uniqueness. Slugs are enforced as a sparse collection and are only locally unique (not unique over multiple instances of the product).

### Arguments for a unique ID per object

It _seems_ like each object needs a unique identifier in an URN like space. I don't have any firm grounding for this - it just seems hard to deal with artifacts that have no id.

Let's use uuid7 to generate unique identifiers per object, but also optionally add a traditional URL resolution tacked on the end, or have a separate slug, to allow for resolution either way:

kid:0199f025-c75d-73f5-b193-7eea5cc8e237:mydomain.com/janet/vacations/rome/photo5.jpg

Also, there's no reason why identifiers cannot be richer, in a sense a query:

```
	entity {
		parent: {
			kid: kid:0199f025-c75d-73f5-b193-7eea5cc8e237:mydomain.com/janet
			kind: 'person'
		}
	}
```

Note: It may make sense to also use DNS as a way to avoid artifacts generated over multiple servers from colliding. This topic needs more research.

### Arguments for a compositional / ECS approach to representing entities

An ECS (entity component system) style approach creates a component namespace - shifting the emphasis away from rich objects. This deviates from schema.org but feels more flexible.

Many properties can be external relations, it's questionable which properties are innate versus external relationships. Relationships are a separate issue that needs to be tackled later.

In any case an entity is ultimately composed out of some set of properties. Arguably these can all be external relationships (indeed in RDF it would be more granular) but the entire entity concept can be thought of as a bucket of related concepts that are so common that it's more efficient to simply always have them present:

```
	{
		id:
		meta: {
			label:
			created:
			updated:
			...
		},
		location: {
			lat:
			lon:
			...
		},
		party: {
			meyers-brigs:
			favorite-color:
			...
		},
		event: {
			spawned:
			deceased:
		}
	}
```

Here's an elaboration of a compositional representation of entities as a typescirpt schema (other ways to represent this may be to use json schema or zod):

```
export interface Entity {
	kid: string,			    // unique identifier in our namespace
	kind?: string,  ?			// debatable if having a 'type' is useful
	meta?: {
		slug?: string,			// optional path in human language
		sponsorKid?: string	    // sponsor entity if any (referenced by kid)
		permissions?: string[]	// permissions is still a work in progress
		createdAt?: string		// when the record was created
		updatedAt?: string		// when the record was updated
	}
	about?: {					// arguably this could be combined with metadata
		label?: string			// many entities have a label as a convention
		content?: string		// some entities may have further content
		depiction?: string		// some entities may have an url or kid path
		tags?: string[]			// some entities may have arbitrary user generated tags
		view?: string			// some entities may have a view flavor (calendar, list, map)
	}
	stats?: {
	    memberCount?: number
	    recentPosts?: number
	}
	location?: {
		latitude?: number | null,
		longitude?: number | null,
		elevation?: number | null,
		radius?: number | null
	}
	address?: {
		iso_3166_1_alpha2?:string,
		iso_3166_2?:string,
		street_number?: string,
		street_name?: string,
		street_suffix?: string,
		floor?: string,
		suite?: string,
		country?: string,
		countryCode:? string,
		region?: string,
		admin1?: string,
		admin2?: string,
		city?: string,
		locality?: string
	}
	event?: {
		begins?: string,
		ends?: string,
	}
	group?: {					// degenerate properties as tags for type?
	}
	party?: {
	}
	place?: {
	}
}
```

## Relationships [ TBD ]

One thing that can upend a property based scheme is defining what is intrinsic to an entity versus simply a relationship.

From a human perspective we live in a world where artifacts are related to each other in various ways - and in fact in part defined by those relationships. Examples:

- people are wedded together at a time and place at a 'wedding'
- a person purchases a hat and they 'own' the hat
- a person becomes friends with another person and has a 'friendship'

These relationships can be atemporal but often the temporality is meaningful. We tend to sort phenomena by when they appeared to us. There are "phenomonological observations" and then "knowledge artifacts":

1) a person got a job, on a date, at a time, a new relationship was formed

2) a person has a job, and a relationship to an employer, and a role; vanilla state

Effectively events in relationships can have a quality of being a predicate, a verb or a noun - suggesting that english does a poor job of notionally capturing these ideas.

**Pragmatically storing relationships**

There are a variety of ways we can store relationships - it may make sense to support multiple solutions.

One approach is that entities can have a property that specifies given relationships - and this can be helpful to restrict non-sensical relationships.

```
const myentity {
	parent: { kid: 1234 }
}
```

Another approach is a relationship table:

```
export interface Relationship {
	label: string,
	a: string,
	b: string,
	date
}
```

**Case study on relationships - oct 30 2025**

A person could be born, own things, have other relationships or events. How can we represent that? This is a test:

```
{
	id: joe
	meta: {
		label: joe
		content:"a person named joe"
	}
	party: {
	}
}

{
	id: car
	meta: {
		label: my volvo
		content:"a vehicle"
	}
	thing: {
	}
}

{
	id: joe-car-event
	meta: {
		label: "car purchase"
	}
	event: {
		begins: jan 14 2024
	}
}

{
	id: 1
	relationship: {
		subject: joe
		predicate: acquired
		target: car
		start: jan 14 2024
	}
}

```

Two ideas are explored above, an event relates a person to a purchased vehicle, or a relationship object does the same job - acting like an impoverished event (in that it doesn't have the meta property)

**questions**

1) Separate Relationships? In colloquial terms people tend to bundle relationships with a given object as in "john has several friends a,b,c" - but for a database representation it may make sense to have these be explicitly in a relationship table - an object could have thousands of relationships and it makes the object too bulky to store. Should relations be separate objects? It seems like the answer is yes.

2) Separate table for relationships? Events and relationships seem to intertwine; "john knows mary" is one way to express a fact, but another way is "john became friends with mary on a date". In the former the relationship stands alone as a concept, in the later there is an ordinary entity (an event) that also defines the relationship. The question is if a relations table should be disjoint from the main collection of entities - as a completely separate table? Are there any cases where might want to refer to a collection of relationships?

3) Formal 'type' field? I'm using components themselves for typing (person, vehicle etc). It might make sense to have a kind or type field? Although this is equivalent to components. Schema.org allows tagging effectively with multiple types. Is that a good idea? An alternative is a hyphenated type hierarchy (party:person, party:pet, party:organization). Presumably this can be effectively indexed in a database either way.
