# Verx

> A lightweight, Git-inspired version control system built from scratch using Node.js

[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Overview

Verx is a functional version control system that demonstrates a deep understanding of core VCS concepts by implementing Git-like functionality from the ground up. This project showcases proficiency in file system operations, cryptographic hashing, data structures, and asynchronous JavaScript programming.

## Key Differences from Git

- Simplified architecture (single file storage vs. Git's packfiles)
- No branching support (yet)
- No remote repository functionality
- Uses full SHA-1 hashes for object paths (Git uses first 2 chars as subdirectory)

## Technical Highlights

- **Content-Addressable Storage**: Implements SHA-1 hashing for deterministic content identification
- **Asynchronous Architecture**: Built entirely with modern async/await patterns for non-blocking I/O
- **Staging Mechanism**: Features a comprehensive staging area for granular commit control
- **Commit Graph**: Maintains a linked-list structure of commits with parent references for history traversal
- **File System Abstraction**: Custom repository initialization and object storage system

## Architecture

### Repository Structure

```
.verx/
├── objects/          # Content-addressable object storage
│   ├── <hash1>      # File contents and commit objects
│   └── <hash2>
├── HEAD             # Reference to current commit
└── index            # Staging area (JSON-formatted)
```

### Core Components

**Object Storage Layer**
- Implements content-addressable storage using SHA-1 cryptographic hashing
- Each object (file content or commit) is stored with its hash as the identifier
- Ensures data integrity and enables efficient deduplication

**Staging Area**
- Intermediate layer between working directory and commit history
- Tracks files marked for inclusion in next commit
- Serialized as JSON for human-readable debugging

**Commit System**
- Each commit stores: timestamp, message, file references, and parent commit
- Commits form a directed acyclic graph (DAG) structure
- Enables full history reconstruction and traversal

## Installation

```bash
# Clone the repository
git clone <url>
cd verx

# Initialize Node.js project
npm init -y

# No external dependencies required - uses Node.js built-in modules
```

## API Reference

### Class: `Verx`

#### Constructor

```javascript
const verx = new Verx(repoPath = '.');
```

Creates a new Verx instance. The repository will be initialized at the specified path.

#### Methods

##### `init()`

```javascript
await verx.init();
```

Initializes a new Verx repository by creating the `.verx` directory structure.

**Returns**: `Promise<void>`

##### `add(filePath)`

```javascript
await verx.add('path/to/file.txt');
```

Stages a file for the next commit.

**Parameters**:
- `filePath` (string): Path to the file to be staged

**Process**:
1. Reads file content
2. Generates SHA-1 hash
3. Stores content in object database
4. Updates staging area index

**Returns**: `Promise<void>`

##### `commit(message)`

```javascript
await verx.commit('Implement user authentication');
```

Creates a new commit with staged files.

**Parameters**:
- `message` (string): Commit message describing the changes

**Commit Structure**:
```json
{
  "timeStamp": "2024-01-15T10:30:00.000Z",
  "message": "Implement user authentication",
  "files": [
    {"path": "auth.js", "hash": "a94a8fe5..."}
  ],
  "parent": "c49fe2c0..."
}
```

**Returns**: `Promise<void>`

##### `log()`

```javascript
await verx.log();
```

Displays commit history in reverse chronological order.

**Output Format**:
```
------------------
Commit : c49fe2c0cc7c338f596eaacf64c513177d20c2fe
Date: 2024-01-15T10:30:00.000Z

Implement user authentication
------------------
```

**Returns**: `Promise<void>`

##### `diff()` *(In Development)*

```javascript
await verx.diff(commitHash1, commitHash2);
```

Compares changes between two commits.

## Usage Example

```javascript
import Verx from './Verx.mjs';

(async () => {
    // Initialize repository
    const verx = new Verx();
    await verx.init();
    
    // Stage files
    await verx.add('src/index.js');
    await verx.add('README.md');
    
    // Create commit
    await verx.commit('Initial project setup');
    
    // Make changes and commit again
    await verx.add('src/index.js');
    await verx.commit('Add error handling');
    
    // View history
    await verx.log();
})();
```

## Implementation Details

### Cryptographic Hashing

Verx uses the SHA-1 algorithm for content addressing:

```javascript
hashObject(content) {
    return crypto.createHash('sha1')
        .update(content, 'utf-8')
        .digest('hex');
}
```

This produces a deterministic 40-character hexadecimal hash that uniquely identifies content, ensuring data integrity and enabling efficient content deduplication.

### Asynchronous Operations

All file system operations use Node.js's `fs/promises` API for non-blocking I/O:

```javascript
import fs from 'fs/promises';

async add(fileToBeAdded) {
    const fileData = await fs.readFile(fileToBeAdded, {encoding: 'utf-8'});
    const fileHash = this.hashObject(fileData);
    // ... additional operations
}
```

### Write-Exclusive Pattern

Repository initialization uses the `wx` flag to prevent accidental overwrites:

```javascript
await fs.writeFile(this.headPath, '', { flag: 'wx' });
```

This ensures that existing repository data is never corrupted during initialization.

## Technical Stack

- **Runtime**: Node.js 16+
- **Language**: JavaScript (ES6+ with ES Modules)
- **Core Modules**: 
  - `fs/promises` - Asynchronous file system operations
  - `path` - Cross-platform path manipulation
  - `crypto` - SHA-1 cryptographic hashing

## Design Decisions

**Why SHA-1?**  
While SHA-1 is cryptographically broken for security purposes, it remains suitable for content addressing in VCS contexts. Git also uses SHA-1, making this choice align with industry standards.

**Why JSON for Commits?**  
Human-readable format facilitates debugging and educational understanding. Production VCS systems use binary formats for efficiency.

**No Branching (Yet)**  
The current implementation maintains a linear history to focus on core VCS concepts. Branch support is a planned enhancement.



## Performance Characteristics

- **Time Complexity**: 
  - Add: O(n) where n is file size
  - Commit: O(m) where m is number of staged files
  - Log: O(k) where k is number of commits

- **Space Complexity**: O(n) where n is total content size (with deduplication)

## Acknowledgments

This project was inspired by Git's elegant design and implements core concepts from the Git internals documentation. Built as an educational exercise to understand version control systems at a fundamental level.

