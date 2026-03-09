(function() {
    // State
    const channels = {
        metallic:  { image: null, fileName: '' },
        ao:        { image: null, fileName: '' },
        detail:    { image: null, fileName: '' },
        roughness: { image: null, fileName: '' }
    };

    let generatedBlob = null;
    let generatedDataURL = null;

    // DOM refs
    const btnGenerate = document.getElementById('btn-generate');
    const btnDownload = document.getElementById('btn-download');
    const outputPreview = document.getElementById('output-preview');
    const outputSize = document.getElementById('output-size');
    const outputFormat = document.getElementById('output-format');
    const invertRoughness = document.getElementById('invert-roughness');
    const toast = document.getElementById('toast');

    // ---- Setup drop zones ----
    ['metallic', 'ao', 'detail', 'roughness'].forEach(ch => {
        const dropZone = document.getElementById(`drop-${ch}`);
        const fileInput = document.getElementById(`file-${ch}`);

        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag events
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
                loadImage(ch, e.dataTransfer.files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                loadImage(ch, fileInput.files[0]);
            }
        });
    });

    function loadImage(channel, file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                channels[channel].image = img;
                channels[channel].fileName = file.name;
                updateCardUI(channel);
                updateGenerateButton();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function updateCardUI(channel) {
        const card = document.querySelector(`.input-card[data-channel="${channel}"]`);
        const dropZone = document.getElementById(`drop-${channel}`);
        const data = channels[channel];

        if (data.image) {
            // Show preview
            dropZone.innerHTML = `
                <img src="${data.image.src}" class="preview-img" alt="${channel}">
            `;

            // Add/update actions bar
            let actionsBar = card.querySelector('.card-actions');
            if (!actionsBar) {
                actionsBar = document.createElement('div');
                actionsBar.className = 'card-actions';
                // Insert before options if exists, else append
                const options = card.querySelector('.card-options');
                if (options) {
                    card.insertBefore(actionsBar, options);
                } else {
                    card.appendChild(actionsBar);
                }
            }
            actionsBar.innerHTML = `
                <span class="file-name" title="${data.fileName}">${data.fileName} (${data.image.width}×${data.image.height})</span>
                <button class="btn-remove" data-channel="${channel}">✕ Remove</button>
            `;

            // Bind remove
            actionsBar.querySelector('.btn-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(channel);
            });
        } else {
            // Reset to drop zone
            dropZone.innerHTML = `
                <div class="drop-icon">⬜</div>
                <div class="drop-text">Drag &amp; drop or <strong>browse</strong><br>PNG, JPG, TGA, EXR</div>
                <input type="file" accept="image/*" id="file-${channel}">
            `;
            // Re-bind file input
            const fileInput = document.getElementById(`file-${channel}`);
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    loadImage(channel, fileInput.files[0]);
                }
            });
            // Remove actions bar
            const actionsBar = card.querySelector('.card-actions');
            if (actionsBar) actionsBar.remove();
        }
    }

    function removeImage(channel) {
        channels[channel].image = null;
        channels[channel].fileName = '';
        updateCardUI(channel);
        updateGenerateButton();
    }

    function updateGenerateButton() {
        const hasAny = Object.values(channels).some(c => c.image !== null);
        btnGenerate.disabled = !hasAny;
    }

    // ---- Generate Mask Map ----
    btnGenerate.addEventListener('click', generateMaskMap);

    function getOutputResolution() {
        const sizeVal = outputSize.value;
        if (sizeVal !== 'auto') {
            const s = parseInt(sizeVal);
            return { width: s, height: s };
        }

        // Auto: use the largest loaded image dimension
        let maxW = 0, maxH = 0;
        Object.values(channels).forEach(c => {
            if (c.image) {
                maxW = Math.max(maxW, c.image.width);
                maxH = Math.max(maxH, c.image.height);
            }
        });

        return { width: maxW || 1024, height: maxH || 1024 };
    }

    function getChannelData(channel, width, height) {
        const canvas = document.getElementById('work-canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const data = channels[channel];
        if (data.image) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(data.image, 0, 0, width, height);
            return ctx.getImageData(0, 0, width, height).data;
        }

        // Default values when no image is provided
        const defaults = {
            metallic: 0,      // No metallic
            ao: 255,          // Full AO (white = no occlusion)
            detail: 0,        // No detail
            roughness: 128    // Mid roughness
        };

        const defaultVal = defaults[channel];
        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = defaultVal;
            pixels[i + 1] = defaultVal;
            pixels[i + 2] = defaultVal;
            pixels[i + 3] = 255;
        }
        return pixels;
    }

    function generateMaskMap() {
        const { width, height } = getOutputResolution();
        
        // Get pixel data for each channel
        const metallicData  = getChannelData('metallic', width, height);
        const aoData        = getChannelData('ao', width, height);
        const detailData    = getChannelData('detail', width, height);
        const roughnessData = getChannelData('roughness', width, height);

        const invert = invertRoughness.checked;

        // Create output image data
        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const outCtx = outCanvas.getContext('2d');
        const outImageData = outCtx.createImageData(width, height);
        const out = outImageData.data;

        for (let i = 0; i < width * height; i++) {
            const pi = i * 4;

            // Grayscale value from each source (use red channel as luminance for simplicity)
            const metallic = metallicData[pi]; // Could also do luminance
            const ao = aoData[pi];
            const detail = detailData[pi];
            let roughness = roughnessData[pi];

            if (invert) {
                roughness = 255 - roughness; // Roughness → Smoothness
            }

            // Pack into RGBA
            out[pi]     = metallic;   // R = Metallic
            out[pi + 1] = ao;         // G = AO
            out[pi + 2] = detail;     // B = Detail Mask
            out[pi + 3] = roughness;  // A = Smoothness
        }

        outCtx.putImageData(outImageData, 0, 0);

        // Generate blob
        const format = outputFormat.value;
        if (format === 'png') {
            outCanvas.toBlob(blob => {
                generatedBlob = blob;
                generatedDataURL = outCanvas.toDataURL('image/png');
                showOutput(outCanvas, width, height, metallicData, aoData, detailData, roughnessData, invert);
            }, 'image/png');
        } else {
            // TGA export
            const tgaBlob = createTGA(out, width, height);
            generatedBlob = tgaBlob;
            generatedDataURL = outCanvas.toDataURL('image/png');
            showOutput(outCanvas, width, height, metallicData, aoData, detailData, roughnessData, invert);
        }
    }

    function showOutput(outCanvas, width, height, metallicData, aoData, detailData, roughnessData, invert) {
        outputPreview.innerHTML = '';

        // Combined mask map preview
        const combinedWrap = createPreviewPanel('Mask Map (RGBA)', outCanvas, true);
        outputPreview.appendChild(combinedWrap);

        // Individual channel previews
        const channelPreviews = [
            { label: 'Red — Metallic', data: metallicData, color: 'r' },
            { label: 'Green — AO', data: aoData, color: 'g' },
            { label: 'Blue — Detail Mask', data: detailData, color: 'b' },
            { label: 'Alpha — Smoothness', data: roughnessData, color: 'a', invert: invert }
        ];

        channelPreviews.forEach(cp => {
            const cvs = document.createElement('canvas');
            cvs.width = width;
            cvs.height = height;
            const ctx = cvs.getContext('2d');
            const imgData = ctx.createImageData(width, height);
            const d = imgData.data;

            for (let i = 0; i < width * height; i++) {
                const pi = i * 4;
                let val = cp.data[pi];
                if (cp.invert) val = 255 - val;

                if (cp.color === 'r') {
                    d[pi] = val; d[pi+1] = 0; d[pi+2] = 0; d[pi+3] = 255;
                } else if (cp.color === 'g') {
                    d[pi] = 0; d[pi+1] = val; d[pi+2] = 0; d[pi+3] = 255;
                } else if (cp.color === 'b') {
                    d[pi] = 0; d[pi+1] = 0; d[pi+2] = val; d[pi+3] = 255;
                } else {
                    d[pi] = val; d[pi+1] = val; d[pi+2] = val; d[pi+3] = 255;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            const wrap = createPreviewPanel(cp.label, cvs, false);
            outputPreview.appendChild(wrap);
        });

        // Resolution info
        const resInfo = document.createElement('div');
        resInfo.className = 'resolution-info';
        resInfo.textContent = `Output: ${width} × ${height} px`;
        outputPreview.appendChild(resInfo);

        // Show download button
        btnDownload.style.display = 'inline-flex';
        showToast('Mask Map generated successfully!');
    }

    function createPreviewPanel(label, canvas, isCheckerboard) {
        const wrap = document.createElement('div');
        wrap.className = 'output-canvas-wrap' + (isCheckerboard ? ' checkerboard' : '');
        
        const displayCanvas = document.createElement('canvas');
        displayCanvas.width = canvas.width;
        displayCanvas.height = canvas.height;
        const ctx = displayCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        
        wrap.appendChild(displayCanvas);

        const labelEl = document.createElement('div');
        labelEl.className = 'canvas-label';
        labelEl.textContent = label;
        wrap.appendChild(labelEl);

        return wrap;
    }

    // ---- TGA Export ----
    function createTGA(pixelData, width, height) {
        // TGA header (18 bytes) for 32-bit uncompressed true color
        const header = new Uint8Array(18);
        header[2] = 2; // Uncompressed true-color
        header[12] = width & 0xFF;
        header[13] = (width >> 8) & 0xFF;
        header[14] = height & 0xFF;
        header[15] = (height >> 8) & 0xFF;
        header[16] = 32; // 32 bits per pixel
        header[17] = 0x28; // Image descriptor (top-left origin + 8 alpha bits)

        // Pixel data: TGA stores as BGRA
        const tgaPixels = new Uint8Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            const si = i * 4;
            tgaPixels[si]     = pixelData[si + 2]; // B
            tgaPixels[si + 1] = pixelData[si + 1]; // G
            tgaPixels[si + 2] = pixelData[si];     // R
            tgaPixels[si + 3] = pixelData[si + 3]; // A
        }

        const blob = new Blob([header, tgaPixels], { type: 'application/octet-stream' });
        return blob;
    }

    // ---- Download ----
    btnDownload.addEventListener('click', () => {
        if (!generatedBlob) return;

        const format = outputFormat.value;
        const ext = format === 'tga' ? 'tga' : 'png';
        
        const link = document.createElement('a');
        link.download = `MaskMap.${ext}`;
        link.href = URL.createObjectURL(generatedBlob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showToast('Download started!');
    });

    // ---- Toast ----
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

})();
