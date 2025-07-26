document.addEventListener('DOMContentLoaded', () => {
    // --- STATE --- //
    let map;
    let user = null;
    let markers = [];
    let userMarkerLayer = L.layerGroup(); // Group for user-added markers
    let landmarkLayer; // To hold the landmark layer
    let contentItems = []; // For the marker modal
    let availableMarkerIcons = {}; // Dynamic marker icons cache

    // --- DOM ELEMENTS --- //
    const userControlsContainer = document.getElementById('user-controls-container');
    const noticeContainer = document.getElementById('notice-container');
    // Login Modal
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const closeLoginBtn = document.getElementById('login-modal-close');
    const cancelLoginBtn = document.getElementById('login-cancel-btn');
    // Marker Modal
    const markerModal = document.getElementById('marker-modal');
    const markerForm = document.getElementById('marker-form');
    const markerCoords = document.getElementById('marker-coords');
    const closeMarkerBtn = document.getElementById('marker-modal-close');
    const cancelMarkerBtn = document.getElementById('marker-cancel-btn');
    const iconInput = document.getElementById('marker-icon');
    const iconPreviewContainer = document.getElementById('icon-preview-container');
    const iconPreview = document.getElementById('icon-preview');
    const contentImagesInput = document.getElementById('marker-content-images');
    const youtubeUrlInput = document.getElementById('marker-youtube-url');
    const addYoutubeBtn = document.getElementById('add-youtube-btn');
    const contentPreviewGrid = document.getElementById('content-preview-grid');
    const contentItemCount = document.getElementById('content-item-count');
    const markerCategory = document.getElementById('marker-category');
    const customIconGroup = document.getElementById('custom-icon-group');
    const isLandmarkCheckbox = document.getElementById('marker-is-landmark');

    // --- ERROR CONTROL --- //
    const errorControl = L.control({position: 'topright'});
    errorControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-error');
        div.style.background = 'rgba(255,0,0,0.8)';
        div.style.color = '#fff';
        div.style.padding = '6px 10px';
        div.style.borderRadius = '4px';
        div.style.display = 'none';
        this._container = div;
        return div;
    };
    errorControl.addTo = function(mapInstance){
        if(!mapInstance.hasLayer(this)) L.Control.prototype.addTo.call(this,mapInstance);
        return this;
    };
    errorControl.show = function(msg){
        this._container.textContent = msg;
        this._container.style.display = 'block';
        setTimeout(()=>{this._container.style.display='none'},4000);
    };

    // --- INITIALIZATION --- //
    
    // Initialize available marker icons from landmark data
    function initializeLandmarkIcons() {
        if (typeof dubaiLandmarks !== 'undefined') {
            console.log('Initializing landmark icons from unified data...');
            availableMarkerIcons = getAllLandmarkIcons();
            console.log('Landmark icons initialized:', availableMarkerIcons);
        } else {
            console.warn('Dubai landmarks data not available, using fallback icons');
            // Fallback to hardcoded icons if data not available
            availableMarkerIcons = {
                1: { url: '/static/images/markers/embedded.svg', size: [57, 86], anchor: [28.5, 43] },
                2: { url: '/static/images/markers/embedded_1.svg', size: [57, 57], anchor: [28.5, 28.5] },
                3: { url: '/static/images/markers/embedded_2.svg', size: [57, 86], anchor: [28.5, 43] },
                4: { url: '/static/images/markers/embedded_3.svg', size: [57, 86], anchor: [28.5, 43] },
                5: { url: '/static/images/markers/embedded_4.svg', size: [57, 86], anchor: [28.5, 43] }
            };
        }
        return availableMarkerIcons;
    }
    
    // Dynamic marker icon scanning (keep for user-added markers)
    async function scanAvailableMarkerIcons() {
        try {
            console.log('Scanning for additional marker icons...');
            
            // Start with landmark icons
            const landmarkIcons = initializeLandmarkIcons();
            
            // Try to get additional icons from the server API
            const response = await fetch('/api/markers/icons', {
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.icons) {
                    // Merge landmark icons with server icons
                    availableMarkerIcons = { ...landmarkIcons, ...data.icons };
                    console.log(`Loaded ${data.count} additional icons from server, total: ${Object.keys(availableMarkerIcons).length}`);
                    return availableMarkerIcons;
                }
            }
            
            console.log(`Using ${Object.keys(landmarkIcons).length} landmark icons only`);
            return landmarkIcons;
        } catch (error) {
            console.error('Error scanning additional marker icons:', error);
            return initializeLandmarkIcons(); // Fall back to landmark icons only
        }
    }
    
    // Helper function to test if an icon exists
    function testIconExists(iconUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = iconUrl;
            
            // Set a timeout to avoid hanging
            setTimeout(() => resolve(false), 2000);
        });
    }

    function initMap() {
        try {
            console.log('Initializing map...');
            map = L.map('map').setView([25.2048, 55.2708], 11); // Dubai coordinates with wider view
            userMarkerLayer.addTo(map); // Add the group to the map
            console.log('Map initialized successfully');

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                detectRetina: true
            }).addTo(map);
                
            console.log('Tile layer added successfully');
            
            // Add map click event
            map.on('click', onMapClick);

            // Note: loadLandmarkLayer() will be called after icons are scanned
            handleLandmarkLayerVisibility(); // Set initial visibility
            map.on('zoomend', handleLandmarkLayerVisibility); // Update on zoom change
        } catch (error) {
            console.error('Error initializing map:', error);
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = '<div style="color: red; padding: 20px;">Error loading map. Please check console for details.</div>';
            }
        }
    }

    // --- AUTHENTICATION --- //
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'same-origin'
            });
            if (response.ok) {
                const data = await response.json();
                user = data.user;
                console.log('Auth check successful:', user);
            } else {
                user = null;
                console.log('Auth check failed - no valid session');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            user = null;
        }
        updateUI();
    }

    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                user = result.user;
                closeLoginModal();
                updateUI();
                fetchMarkers(); // Re-fetch markers to show admin controls if needed
                console.log('Login successful:', user);
            } else {
                loginError.textContent = result.message || 'Login failed';
                loginError.style.display = 'block';
            }
        } catch (error) {
            loginError.textContent = 'Network error. Please try again.';
            loginError.style.display = 'block';
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { 
                method: 'POST',
                credentials: 'same-origin'
            });
            user = null;
            updateUI();
            fetchMarkers(); // Re-fetch markers to hide admin controls
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    // --- UI UPDATES --- //
    function updateUI() {
        updateUserControls();
        updateNotice();
    }

    function updateUserControls() {
        userControlsContainer.innerHTML = '';
        if (user) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>Welcome, <strong>${user.username}</strong></span>
                ${user.role === 'admin' ? '<span class="admin-badge">ADMIN</span>' : ''}
                <button id="logout-btn">Logout</button>
            `;
            userControlsContainer.appendChild(userInfo);
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
        } else {
            const loginButton = document.createElement('button');
            loginButton.id = 'login-btn';
            loginButton.textContent = 'Login';
            userControlsContainer.appendChild(loginButton);
            loginButton.addEventListener('click', openLoginModal);
        }
    }

    function updateNotice() {
        noticeContainer.innerHTML = '';
        if (user && user.role === 'admin') {
            noticeContainer.innerHTML = `<div class="notice admin-notice">👑 <strong>Admin Mode:</strong> Click on the map to add a plot.</div>`;
        } else {
            noticeContainer.innerHTML = `<div class="notice guest-notice">🗺️ <strong>Viewing Mode:</strong> Login as admin to manage plots.</div>`;
        }
    }

    // --- MODAL HANDLING --- //
    function openLoginModal() { 
        loginModal.style.display = 'flex'; 
        loginError.style.display = 'none';
    }
    function closeLoginModal() { 
        loginModal.style.display = 'none';
        loginError.style.display = 'none';
        loginForm.reset();
    }
    function openMarkerModal(latlng) {
        console.log('Opening marker modal with coordinates:', latlng);
        markerCoords.textContent = `Coordinates: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        markerForm.dataset.lat = latlng.lat;
        markerForm.dataset.lng = latlng.lng;
        markerModal.style.display = 'flex';
        console.log('Modal opened, lat/lng set:', markerForm.dataset.lat, markerForm.dataset.lng);
    }
    function closeMarkerModal() {
        markerModal.style.display = 'none';
        markerForm.reset();
        contentItems = [];
        updateContentPreview();
        iconPreview.src = '';
        iconPreviewContainer.style.display = 'none';
        // Reset category and icon requirements
        if (markerCategory) markerCategory.value = '';
        if (iconInput) iconInput.setAttribute('required', '');
        if (customIconGroup) customIconGroup.style.opacity = '1';
    }

    // --- MAP & MARKERS --- //
    function onMapClick(e) {
        console.log('Map clicked:', e.latlng, 'User:', user);
        if (user && user.role === 'admin') {
            console.log('Admin user detected, opening modal');
            openMarkerModal(e.latlng);
        } else {
            console.log('Non-admin user or not logged in');
        }
    }

    function createCustomIcon(iconUrl, category) {
        // If a category is provided, use the corresponding image from dynamic scan
        if (category && availableMarkerIcons[category]) {
            const iconData = availableMarkerIcons[category];
            
            // Create a div with the image as background
            return L.divIcon({
                html: `<div style="background-image: url('${iconData.url}'); background-size: contain; background-repeat: no-repeat; width: 40px; height: 40px;"></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
                className: 'custom-marker-icon'
            });
        }
        
        // Default behavior for custom uploaded icons
        if (iconUrl) {
            return L.divIcon({
                html: `<div style="background-image: url('${iconUrl}'); background-size: cover; background-position: center; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
                className: 'custom-circular-marker'
            });
        }
        
        // Default Leaflet marker if no icon or category
        return new L.Icon.Default();
    }

    function createPopupContent(marker) {
        const container = document.createElement('div');
        container.className = 'popup-content';
        
        let deleteButtonHTML = '';
        if (user && user.role === 'admin') {
            deleteButtonHTML = `<button class="delete-marker-btn" data-id="${marker.id}">🗑️ Delete</button>`;
        }
        
        let googleMapsHTML = '';
        if (marker.googleMapsUrl) {
            googleMapsHTML = `<a href="${marker.googleMapsUrl}" target="_blank" class="google-maps-link" title="View on Google Maps">📍</a>`;
        }
        
        let mediaHTML = '';
        if (marker.contentItems && marker.contentItems.length > 0) {
            mediaHTML = createMediaSlider(marker.contentItems);
        }
        
        container.innerHTML = `
            <div class="popup-header">
                <h4>${marker.title}</h4>
                <div class="popup-actions">
                    ${googleMapsHTML}
                    ${deleteButtonHTML}
                </div>
            </div>
            <p class="popup-description">${marker.description}</p>
            ${mediaHTML}
        `;
        
        // Add delete event listener if admin
        if (user && user.role === 'admin') {
            const deleteBtn = container.querySelector('.delete-marker-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteMarker(marker.id));
            }
        }
        
        // Slider is now self-contained with unique IDs and global navigation
        
        return container;
    }

    function createMediaSlider(contentItems) {
        if (!contentItems || contentItems.length === 0) return '';
        
        const sliderId = 'slider-' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        let mediaItemsHTML = '';
        contentItems.forEach((item, index) => {
            const activeClass = index === 0 ? 'active' : '';
            if (item.type === 'image') {
                mediaItemsHTML += `<div class="media-slide ${activeClass}"><img src="${item.url}" alt="Content image" onerror="this.style.display='none'"></div>`;
            } else if (item.type === 'video' || item.type === 'youtube') {
                const videoId = extractYouTubeId(item.url);
                if (videoId) {
                    mediaItemsHTML += `<div class="media-slide ${activeClass}">
                        <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&enablejsapi=1" 
                                width="100%"
                                height="200"
                                frameborder="0"
                                allowfullscreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                        </iframe>
                    </div>`;
                }
            }
        });
        
        // Create navigation dots
        let dotsHTML = '';
        if (contentItems.length > 1) {
            dotsHTML = '<div class="slider-dots">';
            for (let i = 0; i < contentItems.length; i++) {
                const activeClass = i === 0 ? 'active' : '';
                dotsHTML += `<span class="slider-dot ${activeClass}" data-slide="${i}"></span>`;
            }
            dotsHTML += '</div>';
        }
        
        // Create navigation arrows (only if more than 1 item)
        let arrowsHTML = '';
        if (contentItems.length > 1) {
            arrowsHTML = `
                <button class="slider-arrow slider-prev" type="button">❮</button>
                <button class="slider-arrow slider-next" type="button">❯</button>
            `;
        }
        
        return `
            <div class="media-slider-wrapper" id="${sliderId}" data-current-slide="0" data-total-slides="${contentItems.length}">
                <div class="media-slider-container">
                    ${arrowsHTML}
                    <div class="media-slider-track">
                        ${mediaItemsHTML}
                    </div>
                </div>
                ${dotsHTML}
            </div>
        `;
    }

    function extractYouTubeId(url) {
        // Handle various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/)([^#&?]{11})/,
            /youtube\.com\/watch\?.*v=([^#&?]{11})/,
            /youtube\.com\/shorts\/([^#&?]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // If no match, check if it's just the video ID
        if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }
        
        return null;
    }

    // Enhanced slider navigation function
    window.navigateSlider = function(sliderId, direction) {
        const sliderWrapper = document.getElementById(sliderId);
        if (!sliderWrapper) return;
        
        const slides = sliderWrapper.querySelectorAll('.media-slide');
        const dots = sliderWrapper.querySelectorAll('.slider-dot');
        const totalSlides = parseInt(sliderWrapper.dataset.totalSlides);
        let currentSlide = parseInt(sliderWrapper.dataset.currentSlide);
        
        if (slides.length <= 1) return;
        
        // Remove active class from current slide and dot
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        // Calculate new slide index
        if (typeof direction === 'number') {
            // Arrow navigation
            currentSlide = currentSlide + direction;
            if (currentSlide < 0) currentSlide = totalSlides - 1;
            if (currentSlide >= totalSlides) currentSlide = 0;
        } else {
            // Direct navigation (from dots)
            currentSlide = direction;
        }
        
        // Add active class to new slide and dot
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
        
        // Update slider data
        sliderWrapper.dataset.currentSlide = currentSlide;
        
        console.log(`Slider ${sliderId}: moved to slide ${currentSlide + 1}/${totalSlides}`);
    };

    // Attach slider events to popup
    function attachSliderEvents(popup) {
        const sliders = popup.querySelectorAll('.media-slider-wrapper');
        sliders.forEach(slider => {
            const sliderId = slider.id;
            
            // Handle arrow navigation
            const prevBtn = slider.querySelector('.slider-prev');
            const nextBtn = slider.querySelector('.slider-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, -1);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, 1);
                });
            }
            
            // Handle dot navigation
            const dots = slider.querySelectorAll('.slider-dot');
            dots.forEach((dot, index) => {
                dot.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, index);
                });
            });
        });
    }

    // Function to add markers to the map
    function addMarkersToMap(markerData) {
        try {
            if (!map) {
                console.error('Map is not initialized yet');
                return;
            }
            
            // Clear only the user-added markers from their dedicated layer group
            userMarkerLayer.clearLayers();
            
            // Store the markers data
            markers = Array.isArray(markerData) ? markerData : [];
            
            // Add markers to the map (all markers are now user-added, landmarks come from separate data file)
            markers.forEach(marker => {
                try {
                    if (marker && marker.position && typeof marker.position.lat === 'number' && typeof marker.position.lng === 'number') {
                        const icon = marker.category ? createCustomIcon(marker.iconImage, marker.category) : 
                                    marker.iconImage ? createCustomIcon(marker.iconImage) : undefined;
                        const mapMarker = L.marker([marker.position.lat, marker.position.lng], { icon });
                        userMarkerLayer.addLayer(mapMarker); // Add to the dedicated group
                            
                        // Bind popup with proper event handling
                        mapMarker.bindPopup(() => {
                            const content = createPopupContent(marker);
                            // Ensure slider functions are available when popup opens
                            setTimeout(() => {
                                const popup = document.querySelector('.leaflet-popup-content');
                                if (popup) {
                                    attachSliderEvents(popup);
                                }
                            }, 10);
                            return content;
                        }, { minWidth: 300, maxWidth: 400 });
                    }
                } catch (markerError) {
                    console.error('Error adding marker:', marker, markerError);
                }
            });
            
            console.log(`Rendered ${markers.length} user plots on the map`);
        } catch (error) {
            console.error('Error in addMarkersToMap:', error);
            if (map && errorControl) {
                errorControl.addTo(map).show('Error displaying plots');
            }
        }
    }
    
    // Attach slider events to popup
    function attachSliderEvents(popup) {
        const sliders = popup.querySelectorAll('.media-slider-wrapper');
        sliders.forEach(slider => {
            const sliderId = slider.id;
            
            // Handle arrow navigation
            const prevBtn = slider.querySelector('.slider-prev');
            const nextBtn = slider.querySelector('.slider-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, -1);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, 1);
                });
            }
            
            // Handle dot navigation
            const dots = slider.querySelectorAll('.slider-dot');
            dots.forEach((dot, index) => {
                dot.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.navigateSlider(sliderId, index);
                });
            });
        });
    }

    async function fetchMarkers() {
        try {
            const response = await fetch('/api/markers', {
                credentials: 'same-origin'
            });
            if(!response.ok){
                throw new Error('Server returned '+response.status);
            }
            const data = await response.json();
            addMarkersToMap(data.markers);
        } catch (error) {
            console.error('Error fetching markers:', error);
            if(map){ 
                errorControl.addTo(map).show('Failed to load plots'); 
            }
        }
    }

    // --- CUSTOM CONFIRMATION DIALOG --- //
    function showConfirmDialog(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirm-dialog-overlay');
            const titleElement = overlay.querySelector('.confirm-dialog-title');
            const messageElement = overlay.querySelector('.confirm-dialog-message');
            const cancelBtn = document.getElementById('confirm-cancel');
            const deleteBtn = document.getElementById('confirm-delete');
            
            // Set content
            titleElement.textContent = title;
            messageElement.textContent = message;
            
            // Show dialog
            overlay.classList.add('show');
            
            // Handle button clicks
            const handleCancel = () => {
                overlay.classList.remove('show');
                cleanup();
                resolve(false);
            };
            
            const handleDelete = () => {
                overlay.classList.remove('show');
                cleanup();
                resolve(true);
            };
            
            const cleanup = () => {
                cancelBtn.removeEventListener('click', handleCancel);
                deleteBtn.removeEventListener('click', handleDelete);
                overlay.removeEventListener('click', handleOverlayClick);
            };
            
            const handleOverlayClick = (e) => {
                if (e.target === overlay) {
                    handleCancel();
                }
            };
            
            // Add event listeners
            cancelBtn.addEventListener('click', handleCancel);
            deleteBtn.addEventListener('click', handleDelete);
            overlay.addEventListener('click', handleOverlayClick);
        });
    }

    async function deleteMarker(markerId) {
        const confirmed = await showConfirmDialog(
            'Are you sure you want to delete this plot? This action cannot be undone.',
            'Delete Plot'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Show deleting indicator
            const deletingDiv = document.createElement('div');
            deletingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000;';
            deletingDiv.innerHTML = '<div style="text-align: center;">🗑️ Deleting plot...</div>';
            document.body.appendChild(deletingDiv);
            
            const response = await fetch(`/api/markers/${markerId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                // Close any open popups immediately
                map.closePopup();
                
                // Find the marker to delete first
                const markerToDelete = markers.find(m => m.id === markerId);
                
                // Remove the marker layer from map
                if (markerToDelete) {
                    map.eachLayer(layer => {
                        if (layer instanceof L.Marker) {
                            const latlng = layer.getLatLng();
                            // Check if this marker's position matches the one we want to delete
                            if (Math.abs(latlng.lat - markerToDelete.position.lat) < 0.0001 && 
                                Math.abs(latlng.lng - markerToDelete.position.lng) < 0.0001) {
                                map.removeLayer(layer);
                            }
                        }
                    });
                }
                
                // Remove the marker from local state
                markers = markers.filter(m => m.id !== markerId);
                
                // Remove deleting indicator
                document.body.removeChild(deletingDiv);
                
                console.log('Marker deleted successfully');
            } else {
                document.body.removeChild(deletingDiv);
                const result = await response.json();
                alert('Failed to delete plot: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            if (document.body.contains(deletingDiv)) {
                document.body.removeChild(deletingDiv);
            }
            console.error('Error deleting marker:', error);
            alert('Network error while deleting plot');
        }
    }

    async function submitMarker(e) {
        e.preventDefault();
        const title = document.getElementById('marker-title').value;
        const description = document.getElementById('marker-description').value;
        const googleMapsLink = document.getElementById('marker-google-maps').value;
        const lat = parseFloat(markerForm.dataset.lat);
        const lng = parseFloat(markerForm.dataset.lng);

        if (!title || !description) {
            alert('Please fill in all required fields');
            return;
        }

        const iconFile = document.getElementById('marker-icon').files[0];
        const iconImageBase64 = iconFile ? await fileToBase64(iconFile, 200, 0.9) : null;

        const progressContainer = document.getElementById('image-upload-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        let imageItems = [];
        
        if (selectedImages.length > 0) {
            console.log(`Processing ${selectedImages.length} selected images...`);
            progressContainer.style.display = 'block';
            progressText.textContent = `Processing ${selectedImages.length} images...`;
            
            let processedCount = 0;
            
            for (let i = 0; i < selectedImages.length; i++) {
                const imageData = selectedImages[i];
                try {
                    const base64 = await fileToBase64(imageData.file, 1024, 0.85);
                    imageItems.push({
                        type: 'image',
                        url: base64
                    });
                    processedCount++;
                    
                    // Update progress
                    const progress = (processedCount / selectedImages.length) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `Processed ${processedCount}/${selectedImages.length} images`;
                    
                    console.log(`Processed image ${processedCount}/${selectedImages.length}`);
                } catch (error) {
                    console.error(`Error processing image ${i + 1}:`, error);
                    alert(`Error processing image ${i + 1}. Please try again.`);
                }
            }
            
            progressContainer.style.display = 'none';
            console.log(`Successfully processed ${imageItems.length} images`);
        }
        
        // Combine with existing content items (YouTube videos)
        const allContentItems = [...contentItems, ...imageItems];
        
        const markerData = {
            position: { lat, lng },
            title: title,
            description: description,
            googleMapsUrl: googleMapsLink,
            iconImage: iconImageBase64,
            category: null, // Category has been removed from the form
            contentItems: allContentItems
        };
        
        console.log('Sending marker data:', markerData);
        
        // Show saving indicator
        const savingDiv = document.createElement('div');
        savingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000;';
        savingDiv.innerHTML = '<div style="text-align: center;">💾 Saving plot...</div>';
        document.body.appendChild(savingDiv);
        
        try {
            const response = await fetch('/api/markers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(markerData)
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Marker created successfully:', result);
                
                // Clear selected images and preview
                selectedImages = [];
                const previewContainer = document.getElementById('selected-images-preview');
                const previewGrid = document.getElementById('image-preview-grid');
                previewGrid.innerHTML = '';
                previewContainer.style.display = 'none';
                
                // Clear YouTube videos
                currentContentItems = [];
                updateContentPreview();
                
                // Remove saving indicator
                document.body.removeChild(savingDiv);
                
                closeMarkerModal();
                
                // Add the new marker directly to the map without refetching all
                if (result.marker) {
                    const newMarker = result.marker;
                    markers.push(newMarker);
                    
                    if (newMarker && newMarker.position && typeof newMarker.position.lat === 'number' && typeof newMarker.position.lng === 'number') {
                        const icon = newMarker.category ? createCustomIcon(newMarker.iconImage, newMarker.category) : 
                                    newMarker.iconImage ? createCustomIcon(newMarker.iconImage) : undefined;
                        const mapMarker = L.marker([newMarker.position.lat, newMarker.position.lng], { icon }).addTo(map);
                        
                        // Bind popup with proper event handling
                        mapMarker.bindPopup(() => {
                            const content = createPopupContent(newMarker);
                            setTimeout(() => {
                                const popup = document.querySelector('.leaflet-popup-content');
                                if (popup) {
                                    attachSliderEvents(popup);
                                }
                            }, 10);
                            return content;
                        }, { minWidth: 300, maxWidth: 400 });
                    }
                } else {
                    // Fallback to fetching if marker not returned
                    fetchMarkers();
                }
            } else {
                document.body.removeChild(savingDiv);
                const result = await response.json();
                console.error('API error:', result);
                alert('Failed to create plot: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            if (document.body.contains(savingDiv)) {
                document.body.removeChild(savingDiv);
            }
            console.error('Error creating marker:', error);
            alert('Network error while creating plot');
        }
    }

    // Helper function to convert file to base64 with compression
    function fileToBase64(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                // Set canvas size
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            
            img.onerror = reject;
            
            // Create object URL and load image
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function updateContentPreview() {
        contentItemCount.textContent = contentItems.length;
        contentPreviewGrid.innerHTML = '';
        
        contentItems.forEach((item, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (item.type === 'youtube' || item.type === 'video') {
                const videoId = extractYouTubeId(item.url);
                previewItem.innerHTML = `
                    <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="YouTube thumbnail">
                    <button class="remove-btn" onclick="removeContentItem(${index})">×</button>
                `;
            } else if (item.type === 'image') {
                previewItem.innerHTML = `
                    <img src="${item.url}" alt="Preview">
                    <button class="remove-btn" onclick="removeContentItem(${index})">×</button>
                `;
            }
            
            contentPreviewGrid.appendChild(previewItem);
        });
    }

    function addYouTubeVideo() {
        const url = youtubeUrlInput.value.trim();
        if (!url) return;
        
        const videoId = extractYouTubeId(url);
        if (!videoId) {
            alert('Please enter a valid YouTube URL');
            return;
        }
        
        contentItems.push({
            type: 'video',
            url: url
        });
        
        youtubeUrlInput.value = '';
        updateContentPreview();
    }

    function removeContentItem(index) {
        contentItems.splice(index, 1);
        updateContentPreview();
    }

    // --- LANDMARK LAYER --- //
    function handleLandmarkLayerVisibility() {
        if (!map || !landmarkLayer) return;

        const minZoomForLandmarks = 11;
        if (map.getZoom() >= minZoomForLandmarks) {
            if (!map.hasLayer(landmarkLayer)) {
                map.addLayer(landmarkLayer);
            }
        } else {
            if (map.hasLayer(landmarkLayer)) {
                map.removeLayer(landmarkLayer);
            }
        }
    }

    function loadLandmarkLayer() {
        if (typeof dubaiLandmarks !== 'undefined') {
            console.log('Loading unified Dubai landmark layer...');
            console.log('Landmark data:', dubaiLandmarks);

            const getLandmarkIcon = (feature) => {
                const iconData = feature.properties.icon;
                console.log(`Creating icon for landmark: ${feature.properties.name}`, iconData);
                
                if (iconData && iconData.url) {
                    return L.icon({
                        iconUrl: iconData.url,
                        iconSize: iconData.size,
                        iconAnchor: iconData.anchor,
                        popupAnchor: [0, -iconData.size[1] / 2]
                    });
                }
                
                console.log(`No icon data found for ${feature.properties.name}, using default`);
                return new L.Icon.Default();
            };

            landmarkLayer = L.geoJSON(dubaiLandmarks, {
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, { icon: getLandmarkIcon(feature) });
                },
                onEachFeature: (feature, layer) => {
                    // Create rich popup content with name and description
                    if (feature.properties) {
                        const props = feature.properties;
                        const popupContent = `
                            <div style="max-width: 200px;">
                                <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${props.name}</h4>
                                ${props.description ? `<p style="margin: 0; font-size: 0.9rem; color: #555;">${props.description}</p>` : ''}
                                ${props.category ? `<span style="display: inline-block; margin-top: 8px; padding: 2px 8px; background: #3498db; color: white; border-radius: 10px; font-size: 0.8rem;">${props.category}</span>` : ''}
                            </div>
                        `;
                        layer.bindPopup(popupContent);
                    }
                }
            });

            console.log('Unified landmark layer created and ready.');
        } else {
            console.warn('Unified landmark data (dubaiLandmarks) not found.');
        }
    }

    // --- EVENT LISTENERS --- //
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);
    if (cancelLoginBtn) cancelLoginBtn.addEventListener('click', closeLoginModal);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    if (closeMarkerBtn) closeMarkerBtn.addEventListener('click', closeMarkerModal);
    if (cancelMarkerBtn) cancelMarkerBtn.addEventListener('click', closeMarkerModal);
    if (markerForm) {
        console.log('Marker form found, adding event listener');
        markerForm.addEventListener('submit', submitMarker);
    } else {
        console.error('Marker form not found!');
    }
    
    // Global array to store selected images
    let selectedImages = [];
    
    // Add preview for selected images
    if (contentImagesInput) {
        contentImagesInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                console.log(`Selected ${files.length} new images`);
                addImagesToPreview(files);
            }
        });
    }
    
    function addImagesToPreview(files) {
        const previewContainer = document.getElementById('selected-images-preview');
        const previewGrid = document.getElementById('image-preview-grid');
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const imageId = Date.now() + index;
                selectedImages.push({ id: imageId, file: file });
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.dataset.imageId = imageId;
                    
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="image-preview-remove" onclick="removeImagePreview(${imageId})">×</button>
                    `;
                    
                    previewGrid.appendChild(previewItem);
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Clear the file input
        contentImagesInput.value = '';
    }
    
    // Make function global for onclick
    window.removeImagePreview = function(imageId) {
        selectedImages = selectedImages.filter(img => img.id !== imageId);
        const previewItem = document.querySelector(`[data-image-id="${imageId}"]`);
        if (previewItem) {
            previewItem.remove();
        }
        
        const previewContainer = document.getElementById('selected-images-preview');
        if (selectedImages.length === 0) {
            previewContainer.style.display = 'none';
        }
        
        console.log(`Removed image. ${selectedImages.length} images remaining.`);
    };
    
    // Add preview for icon image
    if (iconInput) {
        iconInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    iconPreview.src = e.target.result;
                    iconPreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // YouTube video handling
    if (addYoutubeBtn) addYoutubeBtn.addEventListener('click', addYouTubeVideo);
    if (youtubeUrlInput) {
        youtubeUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addYouTubeVideo();
            }
        });
    }
    
    // Category dropdown handling
    if (markerCategory) {
        markerCategory.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            if (selectedCategory) {
                // If a category is selected, make icon upload optional
                iconInput.removeAttribute('required');
                customIconGroup.style.opacity = '0.6';
            } else {
                // If no category, icon upload is required
                iconInput.setAttribute('required', '');
                customIconGroup.style.opacity = '1';
            }
        });
    }
    
    // Make functions global for onclick handlers
    window.removeContentItem = removeContentItem;

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
        if (e.target === markerModal) closeMarkerModal();
    });

    // --- INITIALIZATION --- //
    // Initialize map first, then scan icons, check auth and fetch markers
    initMap();
    setTimeout(async () => {
        await scanAvailableMarkerIcons(); // Scan for available icons first
        loadLandmarkLayer(); // Load landmarks AFTER icons are scanned
        handleLandmarkLayerVisibility(); // Update visibility after loading
        checkAuthStatus();
        fetchMarkers();
    }, 100); // Small delay to ensure map is fully initialized
}); 