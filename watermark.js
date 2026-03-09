// Watermark Removal Module
(function() {
    const fileInput = document.getElementById('file-watermark-image');
    const dropZone = document.getElementById('drop-watermark-image');
    
    const canvasOriginal = document.getElementById('canvas-watermark-original');
    const canvasMask = document.getElementById('canvas-watermark-mask');
    const canvasResult = document.getElementById('canvas-watermark-result');
    
    const brushSizeInput = document.getElementById('brush-size');
    const brushSizeDisplay = document.getElementById('brush-size-display');
    const algorithmType = document.getElementById('algorithm-type');
    
    const btnRemove = document.getElementById('btn-remove-watermark');
    const btnReset = document.getElementById('btn-reset-watermark');
    const btnDownload = document.getElementById('btn-download-watermark');
    
    const previewSection = document.getElementById('watermark-preview-section');
    const resultSection = document.getElementById('watermark-result');
    
    const toast = document.getElementById('toast');
    
    let originalImage = null;
    let maskData = null;
    let isDrawing = false;
    let brushSize = 20;
    
    // Setup drop zone
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            loadImage(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            loadImage(fileInput.files[0]);
        }
    });
    
    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                setupCanvases();
                showToast('Image loaded successfully!');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function setupCanvases() {
        const maxWidth = 600;
        const maxHeight = 500;
        
        let width = originalImage.width;
        let height = originalImage.height;
        
        if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
        }
        
        // Setup original canvas
        canvasOriginal.width = width;
        canvasOriginal.height = height;
        const ctxOriginal = canvasOriginal.getContext('2d');
        ctxOriginal.drawImage(originalImage, 0, 0, width, height);
        
        // Setup mask canvas
        canvasMask.width = width;
        canvasMask.height = height;
        const ctxMask = canvasMask.getContext('2d');
        ctxMask.drawImage(originalImage, 0, 0, width, height);
        
        maskData = new Uint8ClampedArray(width * height);
        maskData.fill(0);
        
        setupMaskDrawing();
        
        previewSection.style.display = 'block';
        btnRemove.disabled = false;
    }
    
    function setupMaskDrawing() {
        canvasMask.addEventListener('mousedown', startDrawing);
        canvasMask.addEventListener('mousemove', draw);
        canvasMask.addEventListener('mouseup', stopDrawing);
        canvasMask.addEventListener('mouseout', stopDrawing);
    }
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvasMask.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawMask(x, y);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        const rect = canvasMask.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawMask(x, y);
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function drawMask(x, y) {
        const ctx = canvasMask.getContext('2d');
        const radius = brushSize / 2;
        
        // Draw red circle on canvas
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Mark mask area
        const imgData = ctx.getImageData(0, 0, canvasMask.width, canvasMask.height);
        const data = imgData.data;
        const width = canvasMask.width;
        
        // Draw circle into mask data
        const x0 = Math.max(0, Math.floor(x - radius));
        const x1 = Math.min(width, Math.ceil(x + radius));
        const y0 = Math.max(0, Math.floor(y - radius));
        const y1 = Math.min(canvasMask.height, Math.ceil(y + radius));
        
        for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
                const dx = px - x;
                const dy = py - y;
                if (dx * dx + dy * dy <= radius * radius) {
                    maskData[py * width + px] = 255;
                }
            }
        }
    }
    
    brushSizeInput.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        brushSizeDisplay.textContent = brushSize + 'px';
    });
    
    btnReset.addEventListener('click', () => {
        if (!originalImage) return;
        maskData.fill(0);
        const ctx = canvasMask.getContext('2d');
        ctx.drawImage(originalImage, 0, 0);
        resultSection.style.display = 'none';
        showToast('Mask cleared!');
    });
    
    btnRemove.addEventListener('click', removeWatermark);
    
    function removeWatermark() {
        if (!originalImage || !maskData) return;
        
        // Get image data from canvas
        const ctx = canvasOriginal.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvasOriginal.width, canvasOriginal.height);
        const pixels = imageData.data;
        const width = canvasOriginal.width;
        const height = canvasOriginal.height;
        
        const algo = algorithmType.value;
        
        if (algo === 'inpaint') {
            inpaintRemoval(pixels, width, height, maskData);
        } else {
            cloneToolRemoval(pixels, width, height, maskData);
        }
        
        // Draw result
        ctx.putImageData(imageData, 0, 0);
        
        // Copy to result canvas
        canvasResult.width = canvasOriginal.width;
        canvasResult.height = canvasOriginal.height;
        const ctxResult = canvasResult.getContext('2d');
        ctxResult.drawImage(canvasOriginal, 0, 0);
        
        resultSection.style.display = 'block';
        showToast('Watermark removed successfully!');
    }
    
    function inpaintRemoval(pixels, width, height, mask) {
        const temp = new Uint8ClampedArray(pixels.length);
        temp.set(pixels);
        
        // Multiple passes for better results
        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < width * height; i++) {
                if (mask[i] === 0) continue;
                
                const x = i % width;
                const y = Math.floor(i / width);
                const pi = i * 4;
                
                // Sample surrounding pixels
                const neighbors = [];
                const sampleRadius = 20;
                
                for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
                    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        if (Math.sqrt(dx * dx + dy * dy) < 5) continue; // Skip too close
                        
                        const ni = ny * width + nx;
                        if (mask[ni] > 0) continue; // Skip masked areas
                        
                        neighbors.push(ni);
                    }
                }
                
                if (neighbors.length > 0) {
                    // Average of nearby unmasked pixels
                    let r = 0, g = 0, b = 0, a = 0;
                    neighbors.slice(0, Math.min(5, neighbors.length)).forEach(ni => {
                        const npi = ni * 4;
                        r += pixels[npi];
                        g += pixels[npi + 1];
                        b += pixels[npi + 2];
                        a += pixels[npi + 3];
                    });
                    
                    const count = Math.min(5, neighbors.length);
                    temp[pi] = Math.round(r / count);
                    temp[pi + 1] = Math.round(g / count);
                    temp[pi + 2] = Math.round(b / count);
                    temp[pi + 3] = Math.round(a / count);
                }
            }
            pixels.set(temp);
        }
    }
    
    function cloneToolRemoval(pixels, width, height, mask) {
        // Simple clone tool: find nearest unmasked pixel and copy from it
        for (let i = 0; i < width * height; i++) {
            if (mask[i] === 0) continue;
            
            const x = i % width;
            const y = Math.floor(i / width);
            const pi = i * 4;
            
            // Find nearest unmasked pixel
            let minDist = Infinity;
            let nearestIdx = -1;
            
            for (let dy = -30; dy <= 30; dy++) {
                for (let dx = -30; dx <= 30; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    
                    const ni = ny * width + nx;
                    if (mask[ni] > 0) continue;
                    
                    const dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        nearestIdx = ni;
                    }
                }
            }
            
            if (nearestIdx >= 0) {
                const npi = nearestIdx * 4;
                pixels[pi] = pixels[npi];
                pixels[pi + 1] = pixels[npi + 1];
                pixels[pi + 2] = pixels[npi + 2];
                pixels[pi + 3] = pixels[npi + 3];
            }
        }
    }
    
    btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'watermark-removed.png';
        link.href = canvasResult.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Image downloaded!');
    });
    
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
})();
