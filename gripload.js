class Griploader {
  constructor({ inputId, uploadUrl, chunkSize = 1024 * 1024, onProgress, onComplete, onError }) {
    this.input = document.getElementById(inputId);
    this.uploadUrl = uploadUrl;
    this.chunkSize = chunkSize;
    this.onProgress = onProgress || (() => {});
    this.onComplete = onComplete || (() => {});
    this.onError = onError || (() => {});
    
    if (!this.input) {
      throw new Error(`Element with ID '${inputId}' not found.`);
    }
    
    this.input.addEventListener("change", this.handleFileSelect.bind(this));
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      await this.uploadFile(file);
      this.onComplete(file);
    } catch (error) {
      this.onError(error);
    }
  }

  async uploadFile(file) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      await this.uploadChunk(file.name, chunk, chunkIndex, totalChunks);
      this.onProgress(((chunkIndex + 1) / totalChunks) * 100);
    }
  }

  async uploadChunk(filename, chunk, index, totalChunks) {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("filename", filename);
    formData.append("chunkIndex", index);
    formData.append("totalChunks", totalChunks);
    
    const response = await fetch(this.uploadUrl, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Chunk ${index} upload failed: ${response.statusText}`);
    }
  }
}

// Usage
const uploader = new Griploader({
  inputId: "fileInput",
  uploadUrl: "/upload.php",
  chunkSize: 1024 * 512, // 512 KB per chunk
  onProgress: (percent) => console.log(`Upload Progress: ${percent.toFixed(2)}%`),
  onComplete: (file) => console.log(`Upload complete: ${file.name}`),
  onError: (error) => console.error(`Upload error:`, error),
});
