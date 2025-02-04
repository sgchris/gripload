# Griploader - Chunked File Uploader

## Overview
Griploader is a JavaScript-based file uploader that splits files into chunks and uploads them asynchronously to a server. It supports parallel chunk uploads, configurable chunk sizes, and progress tracking.

## Features
- Uploads large files in chunks
- Configurable number of parallel uploads
- Tracks upload progress
- Handles file selection via an input field
- Error handling and completion callbacks

## Installation
Include `gripload.js` in your HTML file:

```html
<script src="gripload.js"></script>
```

## Usage

### HTML Setup
```html
<form action="" method="post">
    <input type="file" id="upload_1" multiple />
</form>
```

### JavaScript Initialization
```js
const uploader = new Griploader({
    inputId: "upload_1",
    uploadUrl: "upload.php",
    chunkSize: 768 * 1024, // 768 KB per chunk
    onProgress: function (percentage) {
        console.log('Upload progress:', percentage.toFixed(2), '%');
    },
    onComplete: function (file) {
        console.log('Upload complete:', file.name);
    },
    onError: function (error) {
        console.error('Upload error:', error);
    }
});
```

## Server-Side Handling
The `upload.php` file processes file chunks and assembles them into a complete file.

### Expected POST Parameters:
- `chunkNumber`: Index of the current chunk
- `totalChunks`: Total number of chunks
- `fileName`: Original file name
- `uploadToken`: Unique identifier for the upload session

### Example Server Response
```json
{
    "status": "success",
    "message": "Chunk received",
    "chunk": 3
}
```

## Configuration
### Constants in `Griploader.js`
- `CHUNK_SIZE`: Defines the size of each file chunk (default: `1024 * 1024`)
- `PARALLEL_UPLOADS`: Defines how many chunks to upload simultaneously (default: `4`)

## License
This project is open-source and free to use under the MIT License.

---
For any issues or improvements, feel free to contribute!

