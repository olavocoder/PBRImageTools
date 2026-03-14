(function() {
    // State
    let diffuseImage = null;
    let diffuseFileName = '';
    let generatedMaps = {
        normal: null,
        roughness: null,
        metallic: null,
        ao: null,
        maskMap: null
    };
    let generateTimeout = null;

    // DOM refs
    const dropZone = document.getElementById('drop-pbr-diffuse');
    const fileInput = document.getElementById('file-pbr-diffuse');
    const settingsPanel = document.getElementById('pbr-settings');
    const resultsPanel = document.getElementById('pbr-results');
    const previewGrid = document.getElementById('pbr-preview-grid');
    const btnGenerate = document.getElementById('btn-pbr-generate');
    const btnReset = document.getElementById('btn-pbr-reset');
    const btnDownload = document.getElementById('btn-pbr-download');

    // Settings refs
    const normalStrengthSlider = document.getElementById('pbr-normal-strength');
    const normalStrengthDisplay = document.getElementById('pbr-normal-strength-value');
    const roughnessLevelSlider = document.getElementById('pbr-roughness-level');
    const roughnessLevelDisplay = document.getElementById('pbr-roughness-level-value');
    const metallicAmountSlider = document.getElementById('pbr-metallic-amount');
    const metallicAmountDisplay = document.getElementById('pbr-metallic-amount-value');
    const aoIntensitySlider = document.getElementById('pbr-ao-intensity');
    const aoIntensityDisplay = document.getElementById('pbr-ao-intensity-value');
    const outputFormatSelect = document.getElementById('pbr-output-format');
    const outputSizeSelect = document.getElementById('pbr-output-size');

    // ---- Setup drop zone ----
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
            loadDiffuseImage(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            loadDiffuseImage(fileInput.files[0]);
        }
    });

    // ---- Debounce function for live preview ----
    function debounceGenerateLivePreview() {
        clearTimeout(generateTimeout);
        generateTimeout = setTimeout(() => {
            if (diffuseImage) {
                generatePBRMaps(true);
            }
        }, 300); // Wait 300ms after user stops changing
    }
    function loadDiffuseImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                diffuseImage = img;
                diffuseFileName = file.name;
                updateUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function updateUI() {
        dropZone.innerHTML = `
            <img src="${diffuseImage.src}" class="preview-img" alt="diffuse">
        `;
        
        let actionsBar = dropZone.parentElement.querySelector('.card-actions');
        if (!actionsBar) {
            actionsBar = document.createElement('div');
            actionsBar.className = 'card-actions';
            dropZone.parentElement.appendChild(actionsBar);
        }
        actionsBar.innerHTML = `
            <span class="file-name" title="${diffuseFileName}">${diffuseFileName} (${diffuseImage.width}×${diffuseImage.height})</span>
            <button class="btn-remove">✕ Remove</button>
        `;
        
        actionsBar.querySelector('.btn-remove').addEventListener('click', () => {
            resetUI();
        });

        settingsPanel.style.display = 'grid';
        resultsPanel.style.display = 'none';
        previewGrid.innerHTML = '';
    }

    function resetUI() {
        diffuseImage = null;
        diffuseFileName = '';
        generatedMaps = { normal: null, roughness: null, metallic: null, ao: null, maskMap: null };
        
        dropZone.innerHTML = `
            <div class="drop-icon">🎨</div>
            <div class="drop-text">Drag &amp; drop or <strong>browse</strong><br>PNG, JPG, WebP</div>
            <input type="file" accept="image/*" id="file-pbr-diffuse">
        `;
        
        const newFileInput = document.getElementById('file-pbr-diffuse');
        newFileInput.addEventListener('change', () => {
            if (newFileInput.files.length > 0) {
                loadDiffuseImage(newFileInput.files[0]);
            }
        });

        const actionsBar = dropZone.parentElement.querySelector('.card-actions');
        if (actionsBar) actionsBar.remove();

        settingsPanel.style.display = 'none';
        resultsPanel.style.display = 'none';
    }

    // ---- Settings listeners ----
    normalStrengthSlider.addEventListener('input', () => {
        normalStrengthDisplay.textContent = normalStrengthSlider.value;
        debounceGenerateLivePreview();
    });

    roughnessLevelSlider.addEventListener('input', () => {
        roughnessLevelDisplay.textContent = roughnessLevelSlider.value;
        debounceGenerateLivePreview();
    });

    metallicAmountSlider.addEventListener('input', () => {
        metallicAmountDisplay.textContent = metallicAmountSlider.value;
        debounceGenerateLivePreview();
    });

    aoIntensitySlider.addEventListener('input', () => {
        aoIntensityDisplay.textContent = aoIntensitySlider.value;
        debounceGenerateLivePreview();
    });

    outputSizeSelect.addEventListener('change', () => {
        debounceGenerateLivePreview();
    });

    // ---- Button listeners ----
    btnReset.addEventListener('click', resetUI);
    btnGenerate.addEventListener('click', () => generatePBRMaps(false));
    btnDownload.addEventListener('click', downloadMaps);

    // ---- Generate PBR Maps ----
    function generatePBRMaps(isLivePreview = false) {
        if (!diffuseImage) return;

        const { width, height } = getOutputResolution();
        const normalStrength = parseFloat(normalStrengthSlider.value);
        const roughnessLevel = parseInt(roughnessLevelSlider.value);
        const metallicAmount = parseInt(metallicAmountSlider.value);
        const aoIntensity = parseFloat(aoIntensitySlider.value);

        // Get diffuse pixel data
        const canvas = document.getElementById('work-canvas') || createWorkCanvas();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(diffuseImage, 0, 0, width, height);
        const diffusePixels = ctx.getImageData(0, 0, width, height).data;

        // Generate Normal Map
        generatedMaps.normal = generateNormalMap(diffusePixels, width, height, normalStrength);

        // Generate Roughness Map
        generatedMaps.roughness = generateRoughnessMap(diffusePixels, width, height, roughnessLevel);

        // Generate Metallic Map
        generatedMaps.metallic = generateMetallicMap(diffusePixels, width, height, metallicAmount);

        // Generate AO Map
        generatedMaps.ao = generateAOMap(diffusePixels, width, height, aoIntensity);

        // Generate Mask Map (combination of Metallic, AO, Detail, and Roughness)
        generatedMaps.maskMap = generateMaskMapCombined(generatedMaps.metallic, generatedMaps.ao, generatedMaps.roughness, width, height);

        // Show results
        showPBRResults(width, height);
    }

    function getOutputResolution() {
        const sizeVal = outputSizeSelect.value;
        if (sizeVal !== 'auto') {
            const s = parseInt(sizeVal);
            return { width: s, height: s };
        }
        return { width: diffuseImage.width, height: diffuseImage.height };
    }

    function createWorkCanvas() {
        if (!document.getElementById('work-canvas')) {
            const c = document.createElement('canvas');
            c.id = 'work-canvas';
            c.style.display = 'none';
            document.body.appendChild(c);
        }
        return document.getElementById('work-canvas');
    }

    // ---- Generate Normal Map (Sobel Filter) ----
    function generateNormalMap(pixels, width, height, strength) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const outData = ctx.createImageData(width, height);
        const out = outData.data;

        // Convert to grayscale
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const pi = i * 4;
            const r = pixels[pi];
            const g = pixels[pi + 1];
            const b = pixels[pi + 2];
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Sobel filter
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const pi = idx * 4;

                // Sobel kernels
                const gx = -gray[(y-1)*width+(x-1)] - 2*gray[y*width+(x-1)] - gray[(y+1)*width+(x-1)]
                         + gray[(y-1)*width+(x+1)] + 2*gray[y*width+(x+1)] + gray[(y+1)*width+(x+1)];
                const gy = -gray[(y-1)*width+(x-1)] - 2*gray[(y-1)*width+x] - gray[(y-1)*width+(x+1)]
                         + gray[(y+1)*width+(x-1)] + 2*gray[(y+1)*width+x] + gray[(y+1)*width+(x+1)];

                // Convert to normal (normalize and map to 0-255)
                let nx = (gx / 1024) * strength;
                let ny = (gy / 1024) * strength;
                const nz = Math.sqrt(Math.max(0, 1 - nx*nx - ny*ny));

                // Map from [-1, 1] to [0, 255]
                out[pi]     = Math.round(((nx + 1) / 2) * 255);  // X (Red)
                out[pi + 1] = Math.round(((ny + 1) / 2) * 255);  // Y (Green)
                out[pi + 2] = Math.round(nz * 255);              // Z (Blue)
                out[pi + 3] = 255;                               // Alpha
            }
        }

        // Handle edges
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                    const idx = y * width + x;
                    const pi = idx * 4;
                    out[pi]     = 128;
                    out[pi + 1] = 128;
                    out[pi + 2] = 255;
                    out[pi + 3] = 255;
                }
            }
        }

        ctx.putImageData(outData, 0, 0);
        return canvas;
    }

    // ---- Generate Roughness Map ----
    function generateRoughnessMap(pixels, width, height, baseLevel) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const outData = ctx.createImageData(width, height);
        const out = outData.data;

        // Use luminance variation as roughness indicator
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const pi = i * 4;
            const r = pixels[pi];
            const g = pixels[pi + 1];
            const b = pixels[pi + 2];
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Calculate local variance
        for (let i = 0; i < width * height; i++) {
            const x = i % width;
            const y = Math.floor(i / width);

            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                const neighbors = [
                    gray[(y-1)*width+(x-1)], gray[(y-1)*width+x], gray[(y-1)*width+(x+1)],
                    gray[y*width+(x-1)],     gray[i],             gray[y*width+(x+1)],
                    gray[(y+1)*width+(x-1)], gray[(y+1)*width+x], gray[(y+1)*width+(x+1)]
                ];

                const avg = neighbors.reduce((a, b) => a + b, 0) / 9;
                const variance = neighbors.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 9;
                const roughness = Math.min(255, baseLevel + Math.sqrt(variance) * 0.5);

                const pi = i * 4;
                out[pi]     = roughness;
                out[pi + 1] = roughness;
                out[pi + 2] = roughness;
                out[pi + 3] = 255;
            } else {
                const pi = i * 4;
                out[pi]     = baseLevel;
                out[pi + 1] = baseLevel;
                out[pi + 2] = baseLevel;
                out[pi + 3] = 255;
            }
        }

        ctx.putImageData(outData, 0, 0);
        return canvas;
    }

    // ---- Generate Metallic Map ----
    function generateMetallicMap(pixels, width, height, amount) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const outData = ctx.createImageData(width, height);
        const out = outData.data;

        if (amount === 0) {
            // All black (non-metallic)
            for (let i = 0; i < width * height; i++) {
                const pi = i * 4;
                out[pi]     = 0;
                out[pi + 1] = 0;
                out[pi + 2] = 0;
                out[pi + 3] = 255;
            }
        } else {
            // Use saturation/color variation as metallic indicator
            for (let i = 0; i < width * height; i++) {
                const pi = i * 4;
                const r = pixels[pi];
                const g = pixels[pi + 1];
                const b = pixels[pi + 2];

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;

                const metallic = Math.round(saturation * amount);

                out[pi]     = metallic;
                out[pi + 1] = metallic;
                out[pi + 2] = metallic;
                out[pi + 3] = 255;
            }
        }

        ctx.putImageData(outData, 0, 0);
        return canvas;
    }

    // ---- Generate AO Map ----
    function generateAOMap(pixels, width, height, intensity) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const outData = ctx.createImageData(width, height);
        const out = outData.data;

        // Use luminance as AO base (darker areas = more occlusion)
        for (let i = 0; i < width * height; i++) {
            const pi = i * 4;
            const r = pixels[pi];
            const g = pixels[pi + 1];
            const b = pixels[pi + 2];
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            // Invert and apply intensity
            let ao = 255 - luminance;
            ao = 255 - (ao * intensity);

            out[pi]     = ao;
            out[pi + 1] = ao;
            out[pi + 2] = ao;
            out[pi + 3] = 255;
        }

        ctx.putImageData(outData, 0, 0);
        return canvas;
    }

    // ---- Generate Mask Map (combined RGBA) ----
    function generateMaskMapCombined(metallicCanvas, aoCanvas, roughnessCanvas, width, height) {
        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const outCtx = outCanvas.getContext('2d');
        const outImageData = outCtx.createImageData(width, height);
        const outPixels = outImageData.data;

        // Get pixel data from source maps
        const workCanvas = document.getElementById('work-canvas') || createWorkCanvas();
        const ctx = workCanvas.getContext('2d', { willReadFrequently: true });

        // Extract Metallic channel (Red from metallic map)
        workCanvas.width = width;
        workCanvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(metallicCanvas, 0, 0);
        const metallicData = ctx.getImageData(0, 0, width, height).data;

        // Extract AO channel (Green from AO map)
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(aoCanvas, 0, 0);
        const aoData = ctx.getImageData(0, 0, width, height).data;

        // Extract Roughness channel (Alpha from roughness map)
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(roughnessCanvas, 0, 0);
        const roughnessData = ctx.getImageData(0, 0, width, height).data;

        // Combine into Mask Map
        for (let i = 0; i < width * height; i++) {
            const pi = i * 4;

            // R = Metallic
            outPixels[pi]     = metallicData[pi];
            // G = AO
            outPixels[pi + 1] = aoData[pi];
            // B = Detail Mask (derived from roughness variation - set to 0 by default)
            outPixels[pi + 2] = 0;
            // A = Roughness/Smoothness
            outPixels[pi + 3] = roughnessData[pi];
        }

        outCtx.putImageData(outImageData, 0, 0);
        return outCanvas;
    }

    // ---- Show results ----
    function showPBRResults(width, height) {
        previewGrid.innerHTML = '';

        const maps = [
            { label: 'Normal Map (XYZ)', canvas: generatedMaps.normal },
            { label: 'Roughness Map', canvas: generatedMaps.roughness },
            { label: 'Metallic Map', canvas: generatedMaps.metallic },
            { label: 'Ambient Occlusion', canvas: generatedMaps.ao },
            { label: 'Mask Map (RGBA)', canvas: generatedMaps.maskMap }
        ];

        maps.forEach(map => {
            const wrapper = document.createElement('div');
            wrapper.className = 'pbr-preview-item';

            const label = document.createElement('div');
            label.className = 'pbr-preview-label';
            label.textContent = map.label;

            const displayCanvas = document.createElement('canvas');
            displayCanvas.width = Math.min(256, width);
            displayCanvas.height = Math.min(256, height);
            const ctx = displayCanvas.getContext('2d');
            ctx.drawImage(map.canvas, 0, 0, displayCanvas.width, displayCanvas.height);

            wrapper.appendChild(displayCanvas);
            wrapper.appendChild(label);
            previewGrid.appendChild(wrapper);
        });

        const infoDiv = document.createElement('div');
        infoDiv.className = 'resolution-info';
        infoDiv.textContent = `Generated at: ${width} × ${height} px`;
        previewGrid.appendChild(infoDiv);

        resultsPanel.style.display = 'block';
    }

    // ---- Download ----
    function downloadMaps() {
        const format = outputFormatSelect.value;

        if (format === 'png') {
            // Download each map separately
            downloadCanvas(generatedMaps.normal, 'normal.png');
            downloadCanvas(generatedMaps.roughness, 'roughness.png');
            downloadCanvas(generatedMaps.metallic, 'metallic.png');
            downloadCanvas(generatedMaps.ao, 'ambient_occlusion.png');
            downloadCanvas(generatedMaps.maskMap, 'mask_map.png');
        } else {
            // For ZIP support, we'll use a simple approach
            downloadCanvas(generatedMaps.normal, 'normal.png');
            downloadCanvas(generatedMaps.roughness, 'roughness.png');
            downloadCanvas(generatedMaps.metallic, 'metallic.png');
            downloadCanvas(generatedMaps.ao, 'ambient_occlusion.png');
            downloadCanvas(generatedMaps.maskMap, 'mask_map.png');
            showToast('PBR Maps downloaded!');
        }
    }

    function downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
})();
