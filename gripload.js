const MAX_PARALLEL_UPLOADS = 4; // Number of parallel uploads

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

    this.uploadToken = this.generateToken(); // Generate a token for the file upload

    try {
      await this.uploadFile(file);
      this.onComplete(file);
    } catch (error) {
      this.onError(error);
    }
  }

  async uploadFile(file) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    let chunkIndex = 0;
    let activeUploads = 0;
    let completedChunks = 0;

    return new Promise((resolve, reject) => {
      const uploadNext = () => {
        while (activeUploads < MAX_PARALLEL_UPLOADS && chunkIndex < totalChunks) {
          const start = chunkIndex * this.chunkSize;
          const end = Math.min(start + this.chunkSize, file.size);
          const chunk = file.slice(start, end);
          const currentIndex = chunkIndex++;

          activeUploads++;

          this.uploadChunk(file.name, chunk, currentIndex, totalChunks)
            .then(() => {
              completedChunks++;
              this.onProgress((completedChunks / totalChunks) * 100);
            })
            .catch(reject)
            .finally(() => {
              activeUploads--;
              if (completedChunks === totalChunks) {
                resolve();
              } else {
                uploadNext(); // Start the next chunk upload
              }
            });
        }
      };

      uploadNext(); // Start uploading
    });
  }

  async uploadChunk(filename, chunk, index, totalChunks) {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("fileName", filename);
    formData.append("chunkNumber", index);
    formData.append("totalChunks", totalChunks);
    formData.append("uploadToken", this.uploadToken); // Send token

    const response = await fetch(this.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Chunk ${index} upload failed: ${response.statusText}`);
    }
  }

  generateToken() {
    return Math.random().toString(36).substr(2, 10) + Date.now().toString(36);
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
