# Documentation

## Functions

---

### parseTripleSlashBlock

**About:** Parse triple slash comment block and extract structured information

**Parameters:** commentBlock

**Returns:** Object with parsed documentation structure

---

### extractTripleSlashComments

**About:** Extract triple slash comments from source code

**Parameters:** content

**Returns:** Array of parsed documentation objects

---

### detectCodeContext

**About:** Detect what type of code element follows a comment block

**Parameters:** lines, startIndex

**Returns:** Object with type and name, or null

---

### findSourceFiles

**About:** Recursively find all source files in a directory

**Parameters:** dir

**Returns:** Array of file paths with supported extensions

---

### generateMarkdown

**About:** Generate markdown documentation from parsed comments

**Parameters:** allComments, sourceDir

**Returns:** Generated markdown content as string

---

### main

**About:** Main function Processes command line arguments and generates documentation

---

### if

**About:** Run if called directly

## Variables

---

### SUPPORTED_EXTENSIONS

**About:** Simple documentation generator that extracts triple slash comments and generates markdown documentation

