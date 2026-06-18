
Classification Discovery Tool

A Chrome Extension for building a patent reference universe while performing prior art and classification research on FreePatentsOnline (FPO).

The extension allows researchers to quickly save patents as Strong, Partial, or Weak references, automatically extract classification data, and analyze the resulting patent collection through a dashboard with CPC and USPC histograms.

Research Workflow
1. Search patents on FreePatentsOnline.

2. Save relevant patents as:

   Strong
   Partial
   Weak

3. Build a patent universe around the invention.

4. Open the dashboard.

5. Analyze:

   • CPC classes
   • CPC subclasses
   • USPC classes
   • USPC main classes

6. Identify:

   • Dominant technologies
   • Emerging technologies
   • Search gaps
   • Additional classes to investigate

7. Expand the search using newly discovered classifications.


Features
Patent Capture

While viewing a patent on FreePatentsOnline, the extension can automatically extract:

Patent Number
Title
URL
Abstract
Inventor Name
Assignee
Application Number
Filing Date
Publication Date
Primary Class
Other Classes
CPC Classifications
USPC Classifications
Image Count
Save Date

The patent can then be saved as:

Strong
Partial
Weak

references directly from the patent page.

Classification Discovery

The extension automatically extracts:

CPC Codes

Example:

G06F30/13
G06K9/00
G06T7/33
USPC Codes

Example:

703/1

All classifications are stored with each saved patent for later analysis.

Patent Universe Analysis Dashboard

Classification Aggregation
The dashboard can aggregate classifications into broader
technology groupings.

Example:

G06F30/13
G06F30/20
G06F30/00

becomes

G06F30

This allows researchers to identify technology clusters
instead of focusing only on individual CPC leaf classes.

Reference Traceability
Every histogram entry displays the references that contributed
to that classification.

Example:

G06F30.............. 4 [1,2,5,8]

Meaning:

• G06F30 appears four times
• References 1, 2, 5, and 8 contain the classification

This allows researchers to move directly from a technology
cluster back to the underlying patents.

The dashboard provides:

Saved patent list
Patent editing
Column reordering
Reference management
Relevance tracking
CPC histogram analysis
USPC histogram analysis
Classification family aggregation
Reference traceability

Dashboard tabs:

References
CPC Histogram
USPC Histogram
Histogram Analysis

The dashboard can generate frequency distributions for:

All CPC classes
Primary CPC classes
USPC classes

This helps identify:

Technology clusters
Dominant classifications
Patent landscape trends
Search gaps

within a patent universe.

Column Management

The patent table supports:

• Drag and drop column reordering
• Persistent column layouts
• Horizontal scrolling for large patent datasets
• Synchronized edit dialog layout

Column order is stored in Chrome local storage and is automatically reused when opening the patent edit dialog.

Patent Editing

Patents can be edited directly from the dashboard.

Features:

• Edit patent number
• Edit title
• Edit abstract
• Edit inventor name
• Edit assignee
• Change relevance
• Delete patents
• Automatic reference renumbering

The edit dialog dynamically follows the current table column order.

Export Capability

Patent collections can be exported as JSON files for:

Backup
Sharing
Offline analysis
Future imports

Exports are downloaded as:

patent-universe.json

Project Structure
classification-discovery-tool/
│
├── manifest.json
│
├── content/
│   ├── content.js
│   ├── extractor.js
│   ├── fpoExtractor.js
│   └── saveButtons.js
│
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── dashboard.css
│   ├── histogram.js
│   ├── filters.js
│   └── patentTable.js
│
├── storage/
│   ├── storage.js
│   ├── exportImport.js
│   └── schema.js
│
├── popup/
│   ├── popup.html
│   └── popup.js
│
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── README.md
Installation
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

Usage
Saving References
Open a patent on FreePatentsOnline.
Use the floating toolbar in the bottom right corner.
Click:
Strong

or

Partial

or

Weak
The patent is automatically stored in Chrome local storage.
Opening the Dashboard

Click:

Dashboard

from the floating toolbar.

A new tab opens with the patent universe dashboard.

Patent Record Schema

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

Permissions

The extension requires:

Permission	Purpose
storage	Save patent references
downloads	Export patent universe
host_permissions	Access FreePatentsOnline pages

Storage
Patent data is stored locally using:

chrome.storage.local

No patent information is transmitted to external servers.

Saved references remain available across browser sessions
until manually deleted or exported.

Current Version

Version: 1.0.0

Included
Patent extraction
Strong / Partial / Weak relevance tracking
CPC extraction
USPC extraction
Dashboard view
Patent table
Histogram generation
Local storage persistence
JSON export

Patent edit dialog
Dynamic column ordering
Persistent column layouts
Inventor extraction
Application number extraction
Filing date extraction
Publication date extraction
Primary and secondary class support
Reference renumbering

Future Enhancements

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

MIT License

Classification Discovery Tool is designed to help patent researchers build, organize, and analyze a structured patent universe during novelty, patentability, and prior art searches.