# Classification Discovery Tool
## Installation
## Usage
### Saving a Patent
### Opening the Dashboard
### Patent Record Schema
### Current Version
## Research Workflow
## Features
### Patent Capture
### Classification Discovery
#### CPC Examples
#### USPC Examples
### Project Management
### Dashboard
## Dashboard Tabs
### Export
### References
### CPC Histogram
### Primary USPC Histogram
## Histogram Analysis
### Classification Aggregation
### Reference Traceability
### Family Sorting
### Interactive Classification Filtering
###  Histogram Copy
## Patent Table Management
### Patent Editing
### Editable Fields
### Read Only Fields
## Additional Features
## Project Structure
## Storage
## Future Enhancements
## MIT License


Build and analyze a patent reference universe directly from
FreePatentsOnline (FPO).

The extension allows patent researchers to:

* Save references as Strong, Partial, or Weak
* Automatically extract patent metadata
* Discover CPC and USPC classifications
* Build classification histograms
* Trace classifications back to supporting references
* Organize and edit a growing patent universe

## Installation
1. Download the Repository
git clone https://github.com/your-repository/classification-discovery-tool.git
2. Open Chrome Extensions

Navigate to:

chrome://extensions
3. Enable Developer Mode

Turn on:

Developer Mode

in the upper right corner.

4. Load Unpacked

Click:

Load unpacked

Select:

classification-discovery-tool

folder.

## Usage

### Saving a Patent

1. Open a patent page
2. Click:

[Strong]
[Partial]
[Weak]

3. Patent is saved

### Opening the Dashboard

1. Click:

[Dashboard]

2. Dashboard opens in a new tab

---

### Patent Record Schema

Each saved patent is stored independently of projects and classification metadata.

```json
{
  "patentNumber": "11210433",
  "title": "System and method for construction estimation using aerial images",
  "url": "https://www.freepatentsonline.com/11210433.html",

  "relevance": "partial",

  "abstract": "...",

  "inventorName": "John Smith",

  "assignee": "Example Company",

  "applicationNumber": "16/709112",

  "filingDate": "2020-01-10",

  "publicationDate": "2022-01-04",

  "primaryClass": "703/1",

  "otherClasses": [
    "703/2",
    "G06F30/13"
  ],

  "imageCount": 18,

  "cpc": [
    "G06F30/13",
    "G06F30/20"
  ],

  "primaryCpc": [],

  "uspc": [
    "703/1",
    "703/2"
  ],

  "savedDate": "2026-06-16T16:35:00Z"
}
```

### Classification Record Schema

Classification metadata is stored separately and shared across all projects.

```json
{
  "G06F30/13": {
    "classTitle": "Computer aided design",
    "subclassTitle": "Design optimisation",
    "status": "complete",
    "keep": false
  },

  "703/1": {
    "classTitle": "Data Processing",
    "subclassTitle": "Optimization",
    "status": "complete",
    "keep": false
  }
}
```

Status values:

* `"pending"`: Title lookup has not been completed.
* `"complete"`: Titles were successfully retrieved.
* `"failed"`: The classification could not be found or parsed.

### Storage Architecture

The extension stores four primary collections in `chrome.storage.local`:

```text
projects
├── workflow
├── stages
│   ├── landscapeScan
│   ├── referenceList
│   ├── classificationAnalysis
│   ├── universe
│   ├── universeReview
│   └── finalReferences

patents
├── patentNumber
├── patentNumber
└── ...

classifications
├── G06F30/13
├── G06F30
├── 703/1
└── ...

currentProjectId
```

---

### Current Version

Version: 1.1.0

Included

Patent extraction
Strong / Partial / Weak relevance tracking
CPC extraction
USPC extraction

Dashboard view
Patent table
Patent editing
Column reordering
Persistent column layouts

Classification filtering
CPC histogram generation
USPC histogram generation

Classification family aggregation
Reference traceability

Inventor extraction
Application number extraction
Filing date extraction
Publication date extraction

Local storage persistence
JSON export
Reference renumbering

Workflow based research
Multi project support
Automatic CPC title lookup
Automatic USPC title lookup
Primary USPC analysis
Other USPC analysis
Reference List workflow
Classification status tracking
Copy histograms directly to the clipboard.
Compact histogram titles
Live histogram updates
Persistent dashboard layouts

---


## Features
### Patent Capture

Automatically extracts:

* Patent Number
* Title
* URL
* Abstract
* Inventor Name
* Assignee
* Application Number
* Filing Date
* Publication Date
* Primary Class
* Other Classes
* CPC Classifications
* USPC Classifications
* Image Count
* Save Date

## Research Workflow

Landscape Scan

Collect relevant patents from FreePatentsOnline.

↓

Reference List

Look up CPC and USPC titles directly from USPTO classification schedules.

↓

Classification Analysis

Analyze technology concentration using CPC and USPC histograms.

↓

Universe

Expand the search based on discovered classifications.

↓

Universe Review

Review exclusions and research notes.

↓

Final References

Produce the final patent reference universe.

---

### Classification Discovery
The extension retrieves official CPC and USPC titles directly from the USPTO classification schedules.

Parent classifications are automatically stored, allowing class level analysis without requiring separate lookups.

Each lookup is tracked as:

⏳ Pending

✓ Complete

⚠ Failed

Both class titles and subclass titles are stored locally for future analysis.

Automatically extracts:

#### CPC Examples

G06F30/13
G06K9/00
G06T7/33

#### USPC Examples

703/1

### Project Management

• Multiple projects
• Independent patent universes
• Project switching
• Persistent workflow stage

### Dashboard

The dashboard provides:

• Reference Management
• Patent Editing
• CPC Histograms
• Primary USPC Histograms
• Other USPC Histograms
• Project Management
• Workflow Navigation
• Classification Filtering
• Classification Family Aggregation
• Reference Traceability
• Clipboard Export
• Automatic histogram updates after classification lookups

## Dashboard Tabs

References
CPC Histogram
Primary USPC Histogram
Other USPC Histogram

The dashboard can generate frequency distributions for:

All CPC classes and USPC classes

This helps identify:

Technology clusters
Dominant classifications
Patent landscape trends
Search gaps

within a patent universe.

### References

View and edit saved patents.

### CPC Histogram

Analyze CPC classifications and technology families.

### Primary USPC Histogram

Analyze USPC classifications and technology families.

### Other USPC Histogram
Analyzes secondary USPC classifications while excluding the primary classification.

## Histogram Analysis

### Classification Aggregation

G06F30/13
G06F30/20
G06F30/00

↓

G06F30

### Reference Traceability

G06F30 .............. 4 [1,2,5,8]

Meaning:

* Appears 4 times
* References 1, 2, 5, and 8 contain the classification

### Interactive Classification Filtering

Clicking a classification automatically filters the patent table.

Example:

G06F30/13    4 [1,2,5,8]

↓

Only references:

1
2
5
8

remain visible. The filter can be cleared using:

Show All References

### Family Sorting

Histogram results are grouped by technology family before being sorted by frequency, making related classifications appear together.

###  Histogram Copy

Any histogram can be copied directly to the clipboard for reports or spreadsheets.


## Patent Table Management

Features:

* Drag and drop column reordering
* Persistent column layouts
* Horizontal scrolling
* Dynamic edit dialog synchronization

## Patent Editing

The edit dialog automatically mirrors the current table column order, making it easier to review and edit patents without changing context.

### Editable Fields

| Field |
|---------|
| Document Number |
| Title |
| Abstract |
| Inventor Name |
| Assignee |
| Relevance |

### Read Only Fields

| Field |
|---------|
| Application Number |
| Filing Date |
| Publication Date |
| URL |
| Primary Class |
| Other Classes |
| CPC Codes |
| USPC Codes |

## Additional Features

• Delete patents
• Automatic reference renumbering
• Dynamic field ordering
• Dialog synchronized with table layout
• Dynamic edit dialog
• Persistent column layouts
• Persistent histogram layouts
• Project switching
• Workflow persistence
• Compact display for Class Titles and Subclass Titles
• Classification lookup tracking
• Automatic histogram refresh

### Export

Export patent collections as JSON for backup, sharing, and future analysis.

## Project Structure
classification-discovery-tool/
│
├── manifest.json
│
├── content/
│   ├── content.js
│
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── dashboard.css
│   ├── histogram.js
│   └── patentTable.js
│   └── workflow.js
│
├── storage/
│   ├── storage.js
│   ├── exportImport.js
│   └── schema.js
│
└── README.md

## Storage
The extension stores the following locally:

* Patent library
* Projects
* Workflow state
* Classification catalog
• Dashboard preferences
• Patent table column layouts
• Histogram column layouts

No information is transmitted to external servers.

Saved references remain available across browser sessions
until manually deleted or exported.


## Future Enhancements

• Histogram filtering by relevance
• Strong-only classification analysis
• CPC hierarchy drill-down
• USPC hierarchy drill-down
• Patent notes
• Tagging
• Search within patent universe
• Export histogram reports
• Classification trend analytics
• Patent search inside projects
• Duplicate patent detection
• CSV and Excel export
• Citation network visualization
• Classification timeline analysis

## MIT License

Classification Discovery Tool is designed to help patent researchers build, organize, and analyze a structured patent universe during novelty, patentability, and prior art searches.