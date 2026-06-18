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
## Classification Discovery
### CPC Examples
### USPC Examples
## Dashboard
## Dashboard Tabs
### References
### CPC Histogram
### USPC Histogram
## Histogram Analysis
### Classification Aggregation
### Reference Traceability
### Interactive Classification Filtering
## Patent Table Management
## Patent Editing
### Editable Fields
### Read Only Fields
## Additional Features
## Export
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

Each saved patent follows the structure:

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

  "cpc": [],
  "primaryCpc": [],
  "uspc": [],

  "classifications": [],

  "savedDate": "2026-06-16T16:35:00Z"
}

---

### Current Version

Version: 1.0.0

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

---

## Research Workflow

1. Search patents on FreePatentsOnline
2. Save relevant patents
3. Build a patent universe
4. Open the dashboard
5. Analyze classification trends
6. Discover additional search areas
7. Expand the search universe

---


## Features
## Patent Capture

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

## Classification Discovery

Automatically extracts:

### CPC Examples

G06F30/13
G06K9/00
G06T7/33

### USPC Examples

703/1

## Dashboard

The dashboard provides:

* Reference Management
* Patent Editing
* CPC Histograms
* USPC Histograms
* Classification Filtering
* Classification Family Aggregation
* Reference Traceability

## Dashboard Tabs

References
CPC Histogram
USPC Histogram

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

### USPC Histogram

Analyze USPC classifications and technology families.


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


## Patent Table Management

Features:

* Drag and drop column reordering
* Persistent column layouts
* Horizontal scrolling
* Dynamic edit dialog synchronization

## Patent Editing

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

## Export

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
│
├── storage/
│   ├── storage.js
│   ├── exportImport.js
│   └── schema.js
│
└── README.md

## Storage
Patent data is stored locally using:

chrome.storage.local

No patent information is transmitted to external servers.

Saved references remain available across browser sessions
until manually deleted or exported.


## Future Enhancements

• Histogram filtering by relevance
• Strong-only classification analysis
• CPC hierarchy drill-down
• USPC hierarchy drill-down
• Interactive histogram navigation
• Patent notes
• Tagging
• Duplicate detection
• Search within patent universe
• Export histogram reports
• Classification trend analytics
• Dashboard summary cards

## MIT License

Classification Discovery Tool is designed to help patent researchers build, organize, and analyze a structured patent universe during novelty, patentability, and prior art searches.