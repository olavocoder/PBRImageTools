// Image Editor
(function() {
    const dropZone = document.getElementById('drop-editor-image');
    const fileInput = document.getElementById('file-editor-image');
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const workspace = document.getElementById('editor-workspace');

    let originalImage = null;
    let currentImage = null;

    // State for adjustments
    let state = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
        blur: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        filter: 'none'
    };

    // Setup drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            loadImage(files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadImage(e.target.files[0]);
        }
    });

    // Load image
    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                currentImage = img;
                state = {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    hue: 0,
                    blur: 0,
                    rotation: 0,
                    flipH: false,
                    flipV: false,
                    filter: 'none'
                };
                
                // Reset all controls
                document.getElementById('editor-brightness').value = 0;
                document.getElementById('editor-contrast').value = 0;
                document.getElementById('editor-saturation').value = 0;
                document.getElementById('editor-hue').value = 0;
                document.getElementById('editor-blur').value = 0;
                
                // Update all value displays
                document.querySelectorAll('.value-display').forEach(el => {
                    el.textContent = '0';
                });
                
                workspace.style.display = 'grid';
                setupCanvas();
                render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Setup canvas size
    function setupCanvas() {
        const containerWidth = canvas.parentElement.clientWidth - 40;
        const containerHeight = canvas.parentElement.clientHeight - 40;
        
        const aspectRatio = originalImage.width / originalImage.height;
        
        let width = originalImage.width;
        let height = originalImage.height;
        
        if (width > containerWidth || height > containerHeight) {
            if (width / containerWidth > height / containerHeight) {
                width = containerWidth;
                height = width / aspectRatio;
            } else {
                height = containerHeight;
                width = height * aspectRatio;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
    }

    // Render image with current filters
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        
        // Apply transformations at center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Rotation
        if (state.rotation !== 0) {
            ctx.rotate((state.rotation * Math.PI) / 180);
        }
        
        // Flips
        if (state.flipH) ctx.scale(-1, 1);
        if (state.flipV) ctx.scale(1, -1);
        
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Draw image
        ctx.filter = getFilterString();
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }

    // Get CSS filter string
    function getFilterString() {
        const filters = [];
        
        // Brightness
        const brightness = 100 + state.brightness;
        filters.push(`brightness(${brightness}%)`);
        
        // Contrast
        const contrast = 100 + state.contrast;
        filters.push(`contrast(${contrast}%)`);
        
        // Saturation
        const saturation = 100 + state.saturation;
        filters.push(`saturate(${saturation}%)`);
        
        // Hue
        if (state.hue !== 0) {
            filters.push(`hue-rotate(${state.hue}deg)`);
        }
        
        // Blur
        if (state.blur > 0) {
            filters.push(`blur(${state.blur}px)`);
        }
        
        // Special filters
        if (state.filter === 'grayscale') {
            filters.push('grayscale(100%)');
        } else if (state.filter === 'sepia') {
            filters.push('sepia(100%)');
        } else if (state.filter === 'invert') {
            filters.push('invert(100%)');
        }
        
        return filters.join(' ');
    }

    // Slider controls
    const sliders = {
        brightness: document.getElementById('editor-brightness'),
        contrast: document.getElementById('editor-contrast'),
        saturation: document.getElementById('editor-saturation'),
        hue: document.getElementById('editor-hue'),
        blur: document.getElementById('editor-blur')
    };

    Object.entries(sliders).forEach(([key, slider]) => {
        slider.addEventListener('input', (e) => {
            state[key] = parseInt(e.target.value);
            e.target.parentElement.querySelector('.value-display').textContent = e.target.value;
            render();
        });
    });

    // Transform buttons
    document.getElementById('editor-rotate-left').addEventListener('click', () => {
        state.rotation = (state.rotation - 90) % 360;
        render();
    });

    document.getElementById('editor-rotate-right').addEventListener('click', () => {
        state.rotation = (state.rotation + 90) % 360;
        render();
    });

    document.getElementById('editor-flip-h').addEventListener('click', () => {
        state.flipH = !state.flipH;
        render();
    });

    document.getElementById('editor-flip-v').addEventListener('click', () => {
        state.flipV = !state.flipV;
        render();
    });

    // Filter buttons
    document.getElementById('editor-filter-grayscale').addEventListener('click', () => {
        state.filter = state.filter === 'grayscale' ? 'none' : 'grayscale';
        render();
    });

    document.getElementById('editor-filter-sepia').addEventListener('click', () => {
        state.filter = state.filter === 'sepia' ? 'none' : 'sepia';
        render();
    });

    document.getElementById('editor-filter-invert').addEventListener('click', () => {
        state.filter = state.filter === 'invert' ? 'none' : 'invert';
        render();
    });

    // Reset button
    document.getElementById('editor-reset').addEventListener('click', () => {
        if (originalImage) {
            state = {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                hue: 0,
                blur: 0,
                rotation: 0,
                flipH: false,
                flipV: false,
                filter: 'none'
            };
            
            // Reset controls
            Object.values(sliders).forEach(slider => {
                slider.value = 0;
                slider.parentElement.querySelector('.value-display').textContent = '0';
            });
            
            render();
        }
    });

    // Download button
    document.getElementById('editor-download').addEventListener('click', () => {
        if (!originalImage) return;
        
        // Create a temporary canvas to apply filters permanently
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.save();
        
        // Apply transformations
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        if (state.rotation !== 0) {
            tempCtx.rotate((state.rotation * Math.PI) / 180);
        }
        if (state.flipH) tempCtx.scale(-1, 1);
        if (state.flipV) tempCtx.scale(1, -1);
        tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
        
        // Apply filter
        tempCtx.filter = getFilterString();
        tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.restore();
        
        // Download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited-image-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show toast
            showToast('Image downloaded successfully!');
        });
    });

    // Toast notification
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
})();
