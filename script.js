document.addEventListener('DOMContentLoaded', function() {
    // Initialize all image viewers
    const viewers = document.querySelectorAll('.image-viewer');
    viewers.forEach(initializeViewer);
});

function initializeViewer(viewer) {
    const viewerId = viewer.id.split('-')[1];
    const binFile = viewer.dataset.binFile;
    const canvas = document.getElementById(`canvas-${viewerId}`);
    const ctx = canvas.getContext('2d');
    const counter = document.getElementById(`counter-${viewerId}`);
    
    // Image adjustment controls
    const zoomSlider = document.getElementById(`zoom-${viewerId}`);
    const brightnessSlider = document.getElementById(`brightness-${viewerId}`);
    const contrastSlider = document.getElementById(`contrast-${viewerId}`);
    const gammaSlider = document.getElementById(`gamma-${viewerId}`);
    const sharpnessSlider = document.getElementById(`sharpness-${viewerId}`);
    const blurSlider = document.getElementById(`blur-${viewerId}`);
    
    // Navigation buttons
    const prevBtn = viewer.querySelector('.prev-btn');
    const nextBtn = viewer.querySelector('.next-btn');
    
    // State variables
    let images = [];
    let currentImageIndex = 0;
    let imageCount = 0;
    let originalImageData = null;
    
    // Pan and zoom variables
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    // Set canvas dimensions
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderImage();
    }
    
    // Initialize canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load binary file
    loadBinaryFile(`images/${binFile}`);
    
    // Event listeners for navigation
    prevBtn.addEventListener('click', showPreviousImage);
    nextBtn.addEventListener('click', showNextImage);
    
    // Event listeners for adjustments
    zoomSlider.addEventListener('input', handleZoomChange);
    brightnessSlider.addEventListener('input', applyFilters);
    contrastSlider.addEventListener('input', applyFilters);
    gammaSlider.addEventListener('input', applyFilters);
    sharpnessSlider.addEventListener('input', applyFilters);
    blurSlider.addEventListener('input', applyFilters);
    
    // Mouse events for pan and zoom
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    // Touch events for pan and zoom
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Function to load and parse binary file
    function loadBinaryFile(url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load binary file: ${url}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => parseBinaryFile(arrayBuffer))
            .then(() => {
                if (images.length > 0) {
                    showImage(0);
                    updateCounter();
                }
            })
            .catch(error => {
                console.error('Error loading binary file:', error);
                ctx.font = '16px Arial';
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText(`Error loading file: ${error.message}`, canvas.width / 2, canvas.height / 2);
            });
    }
    
    // Parse binary file according to the C# format
    function parseBinaryFile(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        let offset = 0;
        
        // Read number of images
        const imageCount = dataView.getInt32(offset, true); // true for little-endian
        offset += 4;
        
        // Read each image
        for (let i = 0; i < imageCount; i++) {
            // Read JPEG data size
            const jpegDataSize = dataView.getInt32(offset, true);
            offset += 4;
            
            // Extract JPEG data
            const jpegData = new Uint8Array(arrayBuffer, offset, jpegDataSize);
            offset += jpegDataSize;
            
            // Create blob URL for the JPEG data
            const blob = new Blob([jpegData], { type: 'image/jpeg' });
            const imageUrl = URL.createObjectURL(blob);
            
            // Add to images array
            images.push(imageUrl);
        }
        
        imageCount = images.length;
        return images;
    }
    
    // Show image at specified index
    function showImage(index) {
        if (index < 0 || index >= images.length) return;
        
        currentImageIndex = index;
        const img = new Image();
        
        img.onload = function() {
            // Store original image for filters
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);
            originalImageData = tempCtx.getImageData(0, 0, img.width, img.height);
            
            // Reset transformations
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            
            // Reset adjustment sliders
            zoomSlider.value = 100;
            brightnessSlider.value = 0;
            contrastSlider.value = 0;
            gammaSlider.value = 100;
            sharpnessSlider.value = 0;
            blurSlider.value = 0;
            
            renderImage();
            updateCounter();
        };
        
        img.src = images[index];
    }
    
    // Render the current image with all transformations and filters
    function renderImage() {
        if (!originalImageData) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan transformations
        ctx.save();
        ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
        ctx.scale(scale, scale);
        
        // Create a temporary canvas for filters
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImageData.width;
        tempCanvas.height = originalImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Apply filters
        const filteredImageData = applyImageFilters(originalImageData);
        tempCtx.putImageData(filteredImageData, 0, 0);
        
        // Draw the filtered image
        ctx.drawImage(
            tempCanvas, 
            -originalImageData.width / 2, 
            -originalImageData.height / 2
        );
        
        ctx.restore();
    }
    
    // Apply all image filters
    function applyImageFilters(imageData) {
        const brightness = parseInt(brightnessSlider.value);
        const contrast = parseInt(contrastSlider.value);
        const gamma = parseInt(gammaSlider.value) / 100;
        const sharpness = parseInt(sharpnessSlider.value);
        const blur = parseInt(blurSlider.value);
        
        // Create a copy of the image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        
        // Apply CSS filters using a second canvas
        const filterCanvas = document.createElement('canvas');
        filterCanvas.width = imageData.width;
        filterCanvas.height = imageData.height;
        const filterCtx = filterCanvas.getContext('2d');
        
        // Build CSS filter string
        let filterString = '';
        if (brightness !== 0) filterString += `brightness(${100 + brightness}%) `;
        if (contrast !== 0) filterString += `contrast(${100 + contrast}%) `;
        if (gamma !== 1) filterString += `gamma(${gamma}) `;
        if (blur > 0) filterString += `blur(${blur}px) `;
        
        // Apply CSS filters
        filterCtx.filter = filterString;
        filterCtx.drawImage(tempCanvas, 0, 0);
        
        // Apply sharpness if needed (using convolution)
        if (sharpness > 0) {
            const sharpenedData = applySharpen(filterCtx.getImageData(0, 0, imageData.width, imageData.height), sharpness);
            filterCtx.putImageData(sharpenedData, 0, 0);
        }
        
        return filterCtx.getImageData(0, 0, imageData.width, imageData.height);
    }
    
    // Apply sharpening using convolution
    function applySharpen(imageData, amount) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const factor = amount / 10;
        
        // Create a copy of the image data
        const resultData = new Uint8ClampedArray(data);
        
        // Skip the edges to simplify
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // For each color channel (R, G, B)
                for (let c = 0; c < 3; c++) {
                    const currentPixel = data[idx + c];
                    
                    // Apply a simple sharpening kernel
                    const neighbors = [
                        data[((y - 1) * width + x) * 4 + c], // top
                        data[(y * width + (x - 1)) * 4 + c], // left
                        data[(y * width + (x + 1)) * 4 + c], // right
                        data[((y + 1) * width + x) * 4 + c]  // bottom
                    ];
                    
                    const neighborAvg = neighbors.reduce((sum, val) => sum + val, 0) / 4;
                    const diff = currentPixel - neighborAvg;
                    
                    // Apply sharpening
                    resultData[idx + c] = Math.min(255, Math.max(0, currentPixel + diff * factor));
                }
            }
        }
        
        // Create a new ImageData object
        return new ImageData(resultData, width, height);
    }
    
    // Navigation functions
    function showPreviousImage() {
        if (currentImageIndex > 0) {
            showImage(currentImageIndex - 1);
        }
    }
    
    function showNextImage() {
        if (currentImageIndex < images.length - 1) {
            showImage(currentImageIndex + 1);
        }
    }
    
    // Update image counter
    function updateCounter() {
        counter.textContent = `Image ${currentImageIndex + 1} of ${images.length}`;
        
        // Update button states
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === images.length - 1;
    }
    
    // Handle zoom slider change
    function handleZoomChange() {
        scale = parseInt(zoomSlider.value) / 100;
        renderImage();
    }
    
    // Apply filters when sliders change
    function applyFilters() {
        renderImage();
    }
    
    // Mouse event handlers for pan
    function handleMouseDown(e) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    }
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        renderImage();
    }
    
    function handleMouseUp() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }
    
    // Mouse wheel for zoom
    function handleWheel(e) {
        e.preventDefault();
        
        // Calculate zoom factor
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate offset to zoom toward mouse position
        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;
        
        // Adjust offset based on mouse position and zoom factor
        offsetX = (offsetX + (mouseX - canvasCenterX)) * zoomFactor - (mouseX - canvasCenterX);
        offsetY = (offsetY + (mouseY - canvasCenterY)) * zoomFactor - (mouseY - canvasCenterY);
        
        // Apply zoom
        scale *= zoomFactor;
        
        // Update zoom slider
        zoomSlider.value = Math.min(300, Math.max(50, scale * 100));
        
        renderImage();
    }
    
    // Touch event handlers
    let lastTouchDistance = 0;
    
    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            // Single touch for panning
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Two touches for pinch zoom
            isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
        e.preventDefault();
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && isDragging) {
            // Single touch panning
            const touch = e.touches[0];
            const deltaX = touch.clientX - lastX;
            const deltaY = touch.clientY - lastY;
            
            offsetX += deltaX;
            offsetY += deltaY;
            
            lastX = touch.clientX;
            lastY = touch.clientY;
            
            renderImage();
        } else if (e.touches.length === 2) {
            // Pinch zooming
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Calculate current distance
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // Calculate zoom factor
            const zoomFactor = currentDistance / lastTouchDistance;
            
            // Calculate center point between touches
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            // Get position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const canvasCenterX = canvas.width / 2;
            const canvasCenterY = canvas.height / 2;
            const touchX = centerX - rect.left;
            const touchY = centerY - rect.top;
            
            // Adjust offset based on touch position and zoom factor
            offsetX = (offsetX + (touchX - canvasCenterX)) * zoomFactor - (touchX - canvasCenterX);
            offsetY = (offsetY + (touchY - canvasCenterY)) * zoomFactor - (touchY - canvasCenterY);
            
            // Apply zoom
            scale *= zoomFactor;
            
            // Update zoom slider
            zoomSlider.value = Math.min(300, Math.max(50, scale * 100));
            
            lastTouchDistance = currentDistance;
            renderImage();
        }
    }
    
    function handleTouchEnd(e) {
        if (e.touches.length === 0) {
            isDragging = false;
        } else if (e.touches.length === 1) {
            // If we still have one touch, update last position
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
        e.preventDefault();
    }
}