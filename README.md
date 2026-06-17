Classification Discovery Tool

A Chrome Extension for building a patent reference universe while performing prior art and classification research on FreePatentsOnline (FPO).

The extension allows researchers to quickly save patents as Strong, Partial, or Weak references, automatically extract classification data, and analyze the resulting patent collection through a dashboard with CPC and USPC histograms.

Features
Patent Capture

While viewing a patent on FreePatentsOnline, the extension can automatically extract:

Patent Number
Title
URL
Abstract
Assignee
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

Patent Universe Dashboard

The dashboard provides:

Saved patent list
Relevance tracking
Reference management
CPC histogram analysis
USPC histogram analysis

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
  "abstract": "",
  "imageCount": 18,
  "assignee": "Example Company",
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

Future Enhancements

Planned improvements:

Advanced filtering
Patent notes
Tagging system
Duplicate detection
CPC hierarchy exploration
USPC hierarchy exploration
Import support
Classification trend analytics
Search within patent universe
Dashboard statistics cards
License

MIT License

Classification Discovery Tool is designed to help patent researchers build, organize, and analyze a structured patent universe during novelty, patentability, and prior art searches.