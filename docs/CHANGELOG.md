# Classification Discovery Tool

## v1.1.0
Project Centered Architecture

### Added

#### Project Management

- Multi project support
- Project selector
- Project creation
- Project deletion
- Independent project storage
- Current project tracking

#### Workflow

- Landscape Scan stage
- Reference List stage
- Classification Analysis stage
- Universe stage
- Universe Review stage
- Final References stage
- Workflow selector
- Stage specific interface

#### Patent Storage

- Central patent library
- Project specific patent references
- Automatic storage migration from legacy format
- Automatic classification catalog creation

#### Classification Catalog

- Separate classification catalog
- Classification lookup status tracking
- Class title storage
- Subclass title storage
- Keep flag for classifications
- Automatic pending record creation

#### USPTO Classification Lookup

- CPC definition lookup
- USPC definition lookup
- Automatic class title extraction
- Automatic subclass title extraction
- Classification family detection
- Lookup status indicators
- Improved CPC title parsing
- Classification not found detection
- Parse failure detection
- Automatic histogram refresh after lookup

#### Dashboard

- Project selector
- Workflow controls
- Primary USPC histogram
- Other USPC histogram
- CPC histogram
- Family based histogram sorting
- Histogram reference filtering
- Histogram copy to clipboard
- Compact Class Title display
- Compact Subclass Title display
- Dashboard button from content script
- Persistent histogram layouts

#### Patent Records

- Patent URL
- Inventor name
- Assignee
- Application number
- Filing date
- Publication date
- Primary USPC
- Other classifications
- Read only patent metadata fields

#### Import and Export

- Updated JSON export format

### Changed

- Migrated from patent embedded classifications to a centralized classification catalog
- Migrated project storage to a project centered architecture
- Patent records now reference classifications instead of storing metadata within each patent
- Histogram ordering now groups related classification families together
- CPC title extraction supports multi span titles
- Lookup panel automatically selects the current classification family
- Lookup panel displays completion status for each classification family

### Fixed

- Correct CPC class title extraction for parent classifications
- Correct parsing of multi line CPC titles
- Correct handling of missing CPC classifications
- Correct handling of CPC parsing failures
- Correct retrieval of class titles for large CPC definition pages
- Automatic migration of legacy classification status records

---

## v1.0.0
Released

### Added

- Patent capture from FreePatentsOnline
- Strong, Partial, and Weak relevance tracking
- CPC extraction
- USPC extraction
- Patent dashboard
- CPC histogram analysis
- USPC histogram analysis
- Classification family aggregation
- Interactive classification filtering
- Patent editing
- Column reordering
- Persistent layouts
- JSON export
- Reference traceability