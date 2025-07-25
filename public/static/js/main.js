document.addEventListener('DOMContentLoaded', () => {
    // --- STATE --- //
    let map;
    let user = null;
    let markers = [];
    let contentItems = []; // For the marker modal

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
    function initMap() {
        try {
            console.log('Initializing map...');
            map = L.map('map').setView([25.2048, 55.2708], 11); // Dubai coordinates with wider view
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
            
            // Add geolocation control with proper error handling
            addGeolocationControl();
        } catch (error) {
            console.error('Error initializing map:', error);
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = '<div style="color: red; padding: 20px;">Error loading map. Please check console for details.</div>';
            }
        }
    }

    // Add geolocation control
    function addGeolocationControl() {
        const geolocationControl = L.control({position: 'topright'});
        
        geolocationControl.onAdd = function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.backgroundColor = 'white';
            container.style.width = '30px';
            container.style.height = '30px';
            container.style.cursor = 'pointer';
            container.innerHTML = '📍';
            container.style.textAlign = 'center';
            container.style.lineHeight = '30px';
            container.title = 'Go to my location';
            
            container.onclick = function() {
                if (!navigator.geolocation) {
                    console.log('Geolocation is not supported by this browser.');
                    return;
                }
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        map.setView([lat, lng], 16);
                        
                        // Add a temporary marker for user location
                        const userMarker = L.marker([lat, lng]).addTo(map)
                            .bindPopup('Your location')
                            .openPopup();
                        
                        // Remove the marker after 3 seconds
                        setTimeout(() => {
                            map.removeLayer(userMarker);
                        }, 3000);
                    },
                    function(error) {
                        console.log('Geolocation error handled gracefully:', error.message);
                        // Don't show intrusive alerts, just log the error
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                console.log('User denied the request for geolocation.');
                                break;
                            case error.POSITION_UNAVAILABLE:
                                console.log('Location information is unavailable.');
                                break;
                            case error.TIMEOUT:
                                console.log('The request to get user location timed out.');
                                break;
                            default:
                                console.log('An unknown error occurred.');
                                break;
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            };
            
            return container;
        };
        
        geolocationControl.addTo(map);
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
            } else if (response.status === 401) {
                // 401 is expected when no valid session exists
                user = null;
                console.log('No active session - user not logged in');
            } else {
                user = null;
                console.log('Auth check failed with status:', response.status);
            }
        } catch (error) {
            console.error('Auth check network error:', error);
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

    function createCustomIcon(iconUrl) {
        return L.divIcon({
            html: `<div style="background-image: url('${iconUrl}'); background-size: cover; background-position: center; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
            className: 'custom-circular-marker'
        });
    }

    // Function to create SVG-based icons (integrated from HTML)
    function createSvgIcon(markerData) {
        console.log('createSvgIcon called with:', markerData);
        const markerType = markerData.markerType || 'standard';
        
        // Predefined landmark SVG styles (from your HTML file)
        const landmarkStyles = {
            '1': {
                name: 'Government Buildings',
                svgPath: './Goldenbrick/styles/embedded.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '2': {
                name: 'Commercial Centers', 
                svgPath: './Goldenbrick/styles/embedded_1.svg',
                scale: 0.0556640625,
                anchor: [512.0, 512.0],
                imgSize: [1024, 1024]
            },
            '3': {
                name: 'Hotels & Tourism',
                svgPath: './Goldenbrick/styles/embedded_2.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '4': {
                name: 'Skyscrapers',
                svgPath: './Goldenbrick/styles/embedded_3.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '5': {
                name: 'Residential',
                svgPath: './Goldenbrick/styles/embedded_4.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            }
        };
        
        switch(markerType) {
            case 'landmark':
                const category = markerData.landmarkCategory || '1';
                const style = landmarkStyles[category];
                console.log('Creating landmark icon with style:', style);
                
                // Use a more reasonable scale for visibility
                const iconScale = 0.03; // Smaller scale for better visibility
                const iconWidth = style.imgSize[0] * iconScale;
                const iconHeight = style.imgSize[1] * iconScale;
                
                return L.divIcon({
                    html: `<img src="${style.svgPath}" style="width: ${iconWidth}px; height: ${iconHeight}px; display: block;">`,
                    iconSize: [iconWidth, iconHeight],
                    iconAnchor: [iconWidth/2, iconHeight], // Anchor at bottom center
                    popupAnchor: [0, -iconHeight/2],
                    className: 'landmark-svg-marker'
                });
                
            case 'custom-svg':
                const svgContent = markerData.customSvgContent || '';
                const scale = markerData.svgScale || 0.056;
                const rotation = markerData.svgRotation || 0;
                const scaledSize = 60 * (scale * 10); // Adjust multiplier as needed
                
                return L.divIcon({
                    html: `<div style="width: ${scaledSize}px; height: ${scaledSize}px; transform: rotate(${rotation}deg); transform-origin: center;">${svgContent}</div>`,
                    iconSize: [scaledSize, scaledSize],
                    iconAnchor: [scaledSize/2, scaledSize/2],
                    popupAnchor: [0, -scaledSize/2],
                    className: 'custom-svg-marker'
                });
                
            default:
                // Fall back to standard icon
                return markerData.iconImage ? createCustomIcon(markerData.iconImage) : undefined;
        }
    }

    // Function to create appropriate icon based on marker data
    function createAppropriateIcon(markerData) {
        if (markerData.markerType && markerData.markerType !== 'standard') {
            return createSvgIcon(markerData);
        } else {
            return markerData.iconImage ? createCustomIcon(markerData.iconImage) : undefined;
        }
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
        
        let mediaItemsHTML = '';
        contentItems.forEach((item, index) => {
            const activeClass = index === 0 ? 'active' : '';
            if (item.type === 'image') {
                mediaItemsHTML += `<div class="media-item ${activeClass}"><img src="${item.url}" alt="Content image" onerror="this.style.display='none'"></div>`;
            } else if (item.type === 'video' || item.type === 'youtube') {
                const videoId = extractYouTubeId(item.url);
                if (videoId) {
                    mediaItemsHTML += `<div class="media-item ${activeClass}">
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
        
        let controlsHTML = '';
        const sliderId = 'slider-' + Date.now();
        
        if (contentItems.length > 1) {
            controlsHTML = `
                <div class="slider-controls">
                    <button class="slider-btn" onclick="navigateSlider('${sliderId}', -1)">❮ Prev</button>
                    <span class="slider-counter" id="${sliderId}-counter">1 / ${contentItems.length}</span>
                    <button class="slider-btn" onclick="navigateSlider('${sliderId}', 1)">Next ❯</button>
                </div>
            `;
        }
        
        return `
            <div class="media-slider" id="${sliderId}" data-current-slide="0" data-total-slides="${contentItems.length}">
                <div class="media-slider-container">
                    ${mediaItemsHTML}
                </div>
                ${controlsHTML}
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

    // Global slider navigation function
    window.navigateSlider = function(sliderId, direction) {
        const slider = document.getElementById(sliderId);
        if (!slider) return;
        
        const mediaItems = slider.querySelectorAll('.media-item');
        const counter = document.getElementById(sliderId + '-counter');
        const totalSlides = parseInt(slider.dataset.totalSlides);
        let currentSlide = parseInt(slider.dataset.currentSlide);
        
        if (mediaItems.length <= 1) return;
        
        // Remove active class from current slide
        mediaItems[currentSlide].classList.remove('active');
        
        // Calculate new slide index
        currentSlide = currentSlide + direction;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        if (currentSlide >= totalSlides) currentSlide = 0;
        
        // Add active class to new slide
        mediaItems[currentSlide].classList.add('active');
        
        // Update counter
        if (counter) counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        
        // Update slider data
        slider.dataset.currentSlide = currentSlide;
        
        console.log(`Slider ${sliderId}: moved to slide ${currentSlide + 1}/${totalSlides}`);
    };

    function renderMarkers(markerData) {
        try {
            if (!map) {
                console.error('Map is not initialized yet');
                return;
            }
            
            // Clear only marker layers
            map.eachLayer(layer => { 
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
            
            // Store the markers data
            markers = Array.isArray(markerData) ? markerData : [];
            
            // Add markers to the map
            markers.forEach(marker => {
                try {
                    if (marker && marker.position && typeof marker.position.lat === 'number' && typeof marker.position.lng === 'number') {
                        // Use the integrated icon creation function
                        const icon = createAppropriateIcon(marker);
                        const mapMarker = L.marker([marker.position.lat, marker.position.lng], { icon }).addTo(map);

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
            
            console.log(`Rendered ${markers.length} plots on the map`);
        } catch (error) {
            console.error('Error in renderMarkers:', error);
            if (map && errorControl) {
                errorControl.addTo(map).show('Error displaying plots');
            }
        }
    }
    
    // Attach slider events to popup
    function attachSliderEvents(popup) {
        const sliders = popup.querySelectorAll('.media-slider');
        sliders.forEach(slider => {
            const sliderId = slider.id;
            const buttons = slider.querySelectorAll('.slider-btn');
            
            buttons.forEach(btn => {
                // Remove any existing onclick attribute and add event listener
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr) {
                    btn.removeAttribute('onclick');
                    
                    // Parse the direction from the onclick attribute
                    const direction = onclickAttr.includes('-1') ? -1 : 1;
                    
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.navigateSlider(sliderId, direction);
                    });
                }
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
            renderMarkers(data.markers);
        } catch (error) {
            console.error('Error fetching markers:', error);
            if(map){ 
                errorControl.addTo(map).show('Failed to load plots'); 
            }
        }
    }

    async function deleteMarker(markerId) {
        if (!confirm('Are you sure you want to delete this plot?')) {
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
        console.log('submitMarker called');
        
        const title = document.getElementById('marker-title').value;
        const description = document.getElementById('marker-description').value;
        const googleMapsLink = document.getElementById('marker-google-maps').value;
        const lat = parseFloat(markerForm.dataset.lat);
        const lng = parseFloat(markerForm.dataset.lng);
        
        console.log('Form data:', { title, description, googleMapsLink, lat, lng });
        
        if (!title || !description) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Get marker type and SVG data
        const markerType = document.getElementById('marker-type') ? document.getElementById('marker-type').value : 'standard';
        let iconImageBase64 = null;
        let svgMarkerData = {};
        
        // Handle different marker types
        if (markerType === 'standard') {
            // Process icon image with smaller size for icons
            const iconFile = document.getElementById('marker-icon').files[0];
            if (!iconFile) {
                alert('Please select an icon image');
                return;
            }
            iconImageBase64 = await fileToBase64(iconFile, 200, 0.9);
        } else if (markerType === 'landmark') {
            // Get landmark category
            const landmarkCategory = document.getElementById('landmark-category') ? document.getElementById('landmark-category').value : '1';
            svgMarkerData = {
                markerType: 'landmark',
                landmarkCategory: landmarkCategory
            };
        } else if (markerType === 'custom-svg') {
            // Get custom SVG data
            const svgFile = document.getElementById('custom-svg-file').files[0];
            if (!svgFile) {
                alert('Please select an SVG file for custom SVG marker');
                return;
            }
            
            const svgScale = document.getElementById('svg-scale') ? parseFloat(document.getElementById('svg-scale').value) : 0.056;
            const svgRotation = document.getElementById('svg-rotation') ? parseFloat(document.getElementById('svg-rotation').value) : 0;
            
            // Read SVG file content
            const svgContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(svgFile);
            });
            
            svgMarkerData = {
                markerType: 'custom-svg',
                customSvgContent: svgContent,
                svgScale: svgScale,
                svgRotation: svgRotation
            };
        }
        
        // Process selected images with progress feedback
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
            contentItems: allContentItems,
            markerType: markerType,
            ...svgMarkerData  // Spread SVG marker data
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
                updateContentList();
                
                // Remove saving indicator
                document.body.removeChild(savingDiv);
                
                closeMarkerModal();
                
                // Add the new marker directly to the map without refetching all
                if (result.marker) {
                    const newMarker = result.marker;
                    markers.push(newMarker);
                    
                    if (newMarker && newMarker.position && typeof newMarker.position.lat === 'number' && typeof newMarker.position.lng === 'number') {
                        // Use the integrated icon creation function
                        const icon = createAppropriateIcon(newMarker);
                        
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

    // SVG Marker Form Handling
    initializeSvgMarkerInterface();

    function initializeSvgMarkerInterface() {
        // Predefined landmark SVG styles (same as in createSvgIcon)
        const landmarkStyles = {
            '1': {
                name: 'Government Buildings',
                svgPath: './Goldenbrick/styles/embedded.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '2': {
                name: 'Commercial Centers', 
                svgPath: './Goldenbrick/styles/embedded_1.svg',
                scale: 0.0556640625,
                anchor: [512.0, 512.0],
                imgSize: [1024, 1024]
            },
            '3': {
                name: 'Hotels & Tourism',
                svgPath: './Goldenbrick/styles/embedded_2.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '4': {
                name: 'Skyscrapers',
                svgPath: './Goldenbrick/styles/embedded_3.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            },
            '5': {
                name: 'Residential',
                svgPath: './Goldenbrick/styles/embedded_4.svg',
                scale: 0.0556640625,
                anchor: [512.0, 768.0],
                imgSize: [1024, 1536]
            }
        };

        // DOM elements for SVG marker interface
        const markerTypeSelect = document.getElementById('marker-type');
        const standardIconGroup = document.getElementById('standard-icon-group');
        const landmarkSvgGroup = document.getElementById('landmark-svg-group');
        const customSvgGroup = document.getElementById('custom-svg-group');
        const landmarkCategory = document.getElementById('landmark-category');
        const landmarkPreview = document.getElementById('landmark-preview');
        const customSvgFile = document.getElementById('custom-svg-file');
        const customSvgPreview = document.getElementById('custom-svg-preview');
        const customSvgPreviewContainer = document.getElementById('custom-svg-preview-container');
        const svgScale = document.getElementById('svg-scale');
        const svgScaleValue = document.getElementById('svg-scale-value');
        const svgRotation = document.getElementById('svg-rotation');
        const svgRotationValue = document.getElementById('svg-rotation-value');

        // Handle marker type selection
        if (markerTypeSelect) {
            markerTypeSelect.addEventListener('change', function() {
                const selectedType = this.value;
                
                // Hide all groups first
                if (standardIconGroup) standardIconGroup.style.display = 'none';
                if (landmarkSvgGroup) landmarkSvgGroup.style.display = 'none';
                if (customSvgGroup) customSvgGroup.style.display = 'none';
                
                // Show relevant group
                switch(selectedType) {
                    case 'standard':
                        if (standardIconGroup) standardIconGroup.style.display = 'block';
                        // Make icon required for standard type
                        const iconInput = document.getElementById('marker-icon');
                        if (iconInput) iconInput.required = true;
                        break;
                    case 'landmark':
                        if (landmarkSvgGroup) landmarkSvgGroup.style.display = 'block';
                        const iconInput2 = document.getElementById('marker-icon');
                        if (iconInput2) iconInput2.required = false;
                        // Force update landmark preview after a small delay to ensure DOM is ready
                        setTimeout(updateLandmarkPreview, 100);
                        break;
                    case 'custom-svg':
                        if (customSvgGroup) customSvgGroup.style.display = 'block';
                        const iconInput3 = document.getElementById('marker-icon');
                        if (iconInput3) iconInput3.required = false;
                        break;
                }
            });
        }

        // Handle landmark category changes
        if (landmarkCategory) {
            landmarkCategory.addEventListener('change', updateLandmarkPreview);
        }

        // Update landmark preview
        function updateLandmarkPreview() {
            console.log('updateLandmarkPreview called');
            if (!landmarkCategory || !landmarkPreview) return;
            
            const selectedCategory = landmarkCategory.value;
            const style = landmarkStyles[selectedCategory];
            console.log('Selected category:', selectedCategory, 'Style:', style);
            
            if (style) {
                console.log('Updating preview with SVG path:', style.svgPath);
                landmarkPreview.innerHTML = `
                    <img src="${style.svgPath}" 
                         style="max-width: 100%; max-height: 100%; object-fit: contain;" 
                         alt="${style.name} preview"
                         onload="console.log('Image loaded successfully:', this.src);"
                         onerror="console.error('Failed to load image:', this.src); this.style.display='none'; this.parentNode.innerHTML='<span style=color:red>Preview failed to load</span>';">
                `;
            } else {
                console.log('Missing style or landmarkPreview element');
            }
        }

        // Handle custom SVG file upload
        if (customSvgFile) {
            customSvgFile.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file && file.type === 'image/svg+xml') {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const svgContent = e.target.result;
                        if (customSvgPreview) {
                            customSvgPreview.innerHTML = svgContent;
                        }
                        if (customSvgPreviewContainer) {
                            customSvgPreviewContainer.style.display = 'block';
                        }
                        updateCustomSvgPreview();
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Handle SVG scale changes
        if (svgScale) {
            svgScale.addEventListener('input', function() {
                if (svgScaleValue) svgScaleValue.textContent = this.value;
                updateCustomSvgPreview();
            });
        }

        // Handle SVG rotation changes
        if (svgRotation) {
            svgRotation.addEventListener('input', function() {
                if (svgRotationValue) svgRotationValue.textContent = this.value + '°';
                updateCustomSvgPreview();
            });
        }

        // Update custom SVG preview with scale and rotation
        function updateCustomSvgPreview() {
            if (!customSvgPreview) return;
            const svg = customSvgPreview.querySelector('svg');
            if (svg && svgScale && svgRotation) {
                const scale = svgScale.value;
                const rotation = svgRotation.value;
                svg.style.transform = `scale(${scale * 2}) rotate(${rotation}deg)`;
                svg.style.transformOrigin = 'center';
            }
        }

        // Initialize with default selection
        if (markerTypeSelect) {
            markerTypeSelect.dispatchEvent(new Event('change'));
            // If landmark is selected by default, update its preview
            if (markerTypeSelect.value === 'landmark') {
                setTimeout(updateLandmarkPreview, 200);
            }
        }
    }
    
    // Make functions global for onclick handlers
    window.removeContentItem = removeContentItem;
    window.createSvgIcon = createSvgIcon;
    window.createAppropriateIcon = createAppropriateIcon;
    window.createCustomIcon = createCustomIcon;

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
        if (e.target === markerModal) closeMarkerModal();
    });

    // --- INITIALIZATION --- //
    // Initialize map first, then check auth and fetch markers
    initMap();
    setTimeout(() => {
        checkAuthStatus();
        fetchMarkers();
    }, 100); // Small delay to ensure map is fully initialized
});