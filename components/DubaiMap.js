import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import LoginModal from './LoginModal';

// Dubai coordinates
const DUBAI_CENTER = [25.276987, 55.296249];
const ZOOM_LEVEL = 11;

// OpenStreetMap tile config
const OPENSTREETMAP = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Function to compress/resize image to reduce file size
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
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
    
    img.src = URL.createObjectURL(file);
  });
};

// Function to extract YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Function to create YouTube embed URL
const getYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// Function to create YouTube thumbnail URL
const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Function to create Leaflet icon from image
const createImageIcon = (iconImageUrl) => {
  return L.icon({
    iconUrl: iconImageUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'custom-marker-icon'
  });
};

// Add CSS for circular icons and media gallery
const addCircularIconStyles = () => {
  if (typeof document !== 'undefined') {
    const styleId = 'circular-marker-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-marker-icon {
          border-radius: 50% !important;
          border: 3px solid #007bff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          object-fit: cover !important;
          background: white !important;
        }
        .custom-marker-icon img {
          border-radius: 50% !important;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .media-gallery {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
        }
        .gallery-item {
          min-width: 120px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          position: relative;
        }
        .gallery-item:hover {
          border-color: #007bff;
        }
        .gallery-item.video::after {
          content: "▶";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 20px;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
          pointer-events: none;
        }
        .main-media {
          width: 100%;
          max-height: 250px;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .main-image {
          object-fit: cover;
        }
        .youtube-embed {
          aspect-ratio: 16/9;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// Component to handle map click events
function MapClickHandler({ onMapClick, isAdmin }) {
  useMapEvents({
    click: (e) => {
      if (isAdmin) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Media gallery component for popup (supports images and videos)
function MediaGallery({ contentItems }) {
  const [selectedItem, setSelectedItem] = useState(0);

  if (!contentItems || contentItems.length === 0) return null;

  const currentItem = contentItems[selectedItem];

  return (
    <div>
      {currentItem.type === 'image' ? (
        <img
          src={currentItem.url}
          alt="Main view"
          className="main-media main-image"
          style={mainMediaStyle}
        />
      ) : (
        <iframe
          src={getYouTubeEmbedUrl(currentItem.videoId)}
          title="YouTube video"
          className="main-media youtube-embed"
          style={{...mainMediaStyle, aspectRatio: '16/9'}}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      
      {contentItems.length > 1 && (
        <div className="media-gallery" style={mediaGalleryStyle}>
          {contentItems.map((item, index) => (
            <div
              key={index}
              className={`gallery-item ${item.type === 'video' ? 'video' : ''}`}
              style={{
                ...galleryItemStyle,
                border: selectedItem === index ? '2px solid #007bff' : '2px solid transparent'
              }}
              onClick={() => setSelectedItem(index)}
            >
              <img
                src={item.type === 'image' ? item.url : item.thumbnail}
                alt={`${item.type} ${index + 1}`}
                style={galleryThumbnailStyle}
              />
            </div>
          ))}
        </div>
      )}
      
      {contentItems.length > 1 && (
        <p style={galleryCountStyle}>
          {selectedItem + 1} of {contentItems.length} items
        </p>
      )}
    </div>
  );
}

// User info and controls component
function UserControls({ user, onLogin, onLogout }) {
  return (
    <div style={userControlsStyle}>
      {user ? (
        <div style={userInfoStyle}>
          <span style={welcomeTextStyle}>
            Welcome, <strong>{user.username}</strong> 
            {user.role === 'admin' && <span style={adminBadgeStyle}>ADMIN</span>}
          </span>
          <button onClick={onLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      ) : (
        <button onClick={onLogin} style={loginButtonStyle}>
          Login
        </button>
      )}
    </div>
  );
}

// Modal component for marker input (admin only)
function MarkerInputModal({ isOpen, onClose, onSubmit, position }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconImage, setIconImage] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const iconInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const handleIconChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Compress the image for icon (smaller size for better performance)
        const compressedImage = await compressImage(file, 400, 0.8);
        setIconImage(compressedImage);
        setIconPreview(compressedImage);
      } catch (error) {
        console.error('Error compressing icon image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target.result;
          setIconImage(base64String);
          setIconPreview(base64String);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleContentImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Compress content images (larger size but still optimized)
        const compressedImage = await compressImage(file, 800, 0.8);
        const newItem = {
          type: 'image',
          url: compressedImage,
          preview: compressedImage
        };
        setContentItems(prev => [...prev, newItem]);
      } catch (error) {
        console.error('Error compressing content image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target.result;
          const newItem = {
            type: 'image',
            url: base64String,
            preview: base64String
          };
          setContentItems(prev => [...prev, newItem]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleYouTubeAdd = () => {
    if (youtubeUrl.trim()) {
      const videoId = getYouTubeVideoId(youtubeUrl.trim());
      if (videoId) {
        const newItem = {
          type: 'video',
          url: youtubeUrl.trim(),
          videoId: videoId,
          thumbnail: getYouTubeThumbnail(videoId),
          preview: getYouTubeThumbnail(videoId)
        };
        setContentItems(prev => [...prev, newItem]);
        setYoutubeUrl('');
      } else {
        alert('Please enter a valid YouTube URL');
      }
    }
  };

  const removeContentItem = (index) => {
    setContentItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim() && description.trim() && iconImage && contentItems.length > 0) {
      setLoading(true);
      try {
        await onSubmit({
          position,
          title: title.trim(),
          description: description.trim(),
          iconImage,
          contentItems,
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setIconImage(null);
        setIconPreview(null);
        setContentItems([]);
        setYoutubeUrl('');
        if (iconInputRef.current) {
          iconInputRef.current.value = '';
        }
        if (contentInputRef.current) {
          contentInputRef.current.value = '';
        }
        onClose();
      } catch (error) {
        alert('Failed to create marker: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please provide title, description, icon image, and at least one content item (image or video)');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setIconImage(null);
    setIconPreview(null);
    setContentItems([]);
    setYoutubeUrl('');
    if (iconInputRef.current) {
      iconInputRef.current.value = '';
    }
    if (contentInputRef.current) {
      contentInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={modalTitleStyle}>Add Marker (Admin)</h3>
        <p style={coordinatesStyle}>
          Coordinates: {position?.lat.toFixed(6)}, {position?.lng.toFixed(6)}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter marker title"
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter marker description"
              style={textareaStyle}
              rows={3}
              required
              disabled={loading}
            />
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Icon Image (for map marker):</label>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              style={fileInputStyle}
              required
              disabled={loading}
            />
            <p style={helperTextStyle}>
              This image will appear as the circular marker icon on the map (auto-compressed for optimal performance)
            </p>
            {iconPreview && (
              <div style={iconPreviewContainerStyle}>
                <p style={previewLabelStyle}>Icon Preview:</p>
                <img
                  src={iconPreview}
                  alt="Icon preview"
                  style={iconPreviewStyle}
                />
              </div>
            )}
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Content (Images & Videos):</label>
            
            {/* Image Upload */}
            <div style={mediaInputSectionStyle}>
              <label style={subLabelStyle}>📸 Add Images:</label>
              <input
                ref={contentInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleContentImagesChange}
                style={fileInputStyle}
                disabled={loading}
              />
              <p style={helperTextStyle}>
                Images will be automatically compressed for optimal loading
              </p>
            </div>

            {/* YouTube URL Input */}
            <div style={mediaInputSectionStyle}>
              <label style={subLabelStyle}>🎬 Add YouTube Video:</label>
              <div style={youtubeInputContainerStyle}>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                  style={{...inputStyle, marginBottom: '0.5rem'}}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleYouTubeAdd}
                  style={addVideoButtonStyle}
                  disabled={!youtubeUrl.trim() || loading}
                >
                  Add Video
                </button>
              </div>
            </div>

            <p style={helperTextStyle}>
              Add multiple images and YouTube videos to create a rich media gallery
            </p>
            
            {contentItems.length > 0 && (
              <div style={contentPreviewContainerStyle}>
                <p style={previewLabelStyle}>Content Items ({contentItems.length}):</p>
                <div style={previewGridStyle}>
                  {contentItems.map((item, index) => (
                    <div key={index} style={previewItemContainerStyle}>
                      <div style={previewItemStyle}>
                        <img
                          src={item.preview}
                          alt={`${item.type} ${index + 1}`}
                          style={contentPreviewStyle}
                        />
                        {item.type === 'video' && (
                          <div style={videoIndicatorStyle}>▶</div>
                        )}
                        <span style={typeIndicatorStyle}>
                          {item.type === 'video' ? '🎬' : '📸'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContentItem(index)}
                        style={removeButtonStyle}
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div style={buttonContainerStyle}>
            <button 
              type="submit" 
              style={{
                ...submitButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Add Marker'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              style={cancelButtonStyle}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Dubai Map component
export default function DubaiMap() {
  const [markers, setMarkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    fetchMarkers();
    addCircularIconStyles();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkers = async () => {
    try {
      const response = await fetch('/api/markers');
      if (response.ok) {
        const data = await response.json();
        setMarkers(data.markers);
      }
    } catch (error) {
      console.error('Failed to fetch markers:', error);
    }
  };

  const handleMapClick = (latlng) => {
    if (user && user.role === 'admin') {
      setClickedPosition(latlng);
      setShowModal(true);
    }
  };

  const handleModalSubmit = async (markerData) => {
    try {
      const response = await fetch('/api/markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markerData),
      });

      if (response.ok) {
        const data = await response.json();
        setMarkers(prev => [data.marker, ...prev]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create marker');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteMarker = async (markerId) => {
    if (!window.confirm('Are you sure you want to delete this marker?')) {
      return;
    }

    try {
      const response = await fetch(`/api/markers/${markerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMarkers(prev => prev.filter(marker => marker.id !== markerId));
      } else {
        const errorData = await response.json();
        alert('Failed to delete marker: ' + errorData.message);
      }
    } catch (error) {
      alert('Failed to delete marker: ' + error.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setClickedPosition(null);
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={loadingContentStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading Dubai Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <UserControls 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      
      {!user && (
        <div style={guestNoticeStyle}>
          <p style={guestNoticeTextStyle}>
            🗺️ <strong>Viewing Mode:</strong> You can see all markers on the map. 
            Login as admin to add or delete markers.
          </p>
        </div>
      )}

      {user && user.role === 'admin' && (
        <div style={adminNoticeStyle}>
          <p style={adminNoticeTextStyle}>
            👑 <strong>Admin Mode:</strong> Click anywhere on the map to add new markers. 
            Click delete button in popups to remove markers.
          </p>
        </div>
      )}

      <MapContainer
        center={DUBAI_CENTER}
        zoom={ZOOM_LEVEL}
        style={mapStyle}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={OPENSTREETMAP.attribution}
          url={OPENSTREETMAP.url}
        />
        
        <MapClickHandler 
          onMapClick={handleMapClick} 
          isAdmin={user && user.role === 'admin'} 
        />
        
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position}
            icon={createImageIcon(marker.iconImage)}
          >
            <Popup maxWidth={400} minWidth={300}>
              <div style={popupContentStyle}>
                <div style={popupHeaderStyle}>
                  <h4 style={popupTitleStyle}>{marker.title}</h4>
                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteMarker(marker.id)}
                      style={deleteMarkerButtonStyle}
                      title="Delete this marker"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <p style={popupDescriptionStyle}>{marker.description}</p>
                <MediaGallery contentItems={marker.contentItems} />
                <p style={popupCoordsStyle}>
                  {marker.position.lat.toFixed(6)}, {marker.position.lng.toFixed(6)}
                </p>
                {marker.createdBy && (
                  <p style={createdByStyle}>
                    Created by: {marker.createdBy}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <MarkerInputModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        position={clickedPosition}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

// Styles
const containerStyle = {
  position: 'relative',
  width: '100%',
  height: '100vh',
};

const mapStyle = {
  width: '100%',
  height: '100%',
};

const loadingStyle = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f8f9fa',
};

const loadingContentStyle = {
  textAlign: 'center',
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #007bff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 1rem auto',
};

const loadingTextStyle = {
  fontSize: '1.1rem',
  color: '#6c757d',
  margin: 0,
};

const userControlsStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  zIndex: 1000,
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  backgroundColor: 'white',
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  border: '1px solid #ddd',
};

const welcomeTextStyle = {
  fontSize: '0.9rem',
  color: '#333',
};

const adminBadgeStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '0.7rem',
  marginLeft: '0.5rem',
  fontWeight: 'bold',
};

const loginButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const logoutButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  cursor: 'pointer',
};

const guestNoticeStyle = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  zIndex: 1000,
  backgroundColor: '#e3f2fd',
  border: '1px solid #2196f3',
  borderRadius: '4px',
  padding: '0.75rem 1rem',
  maxWidth: '400px',
};

const guestNoticeTextStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#1976d2',
};

const adminNoticeStyle = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  zIndex: 1000,
  backgroundColor: '#f3e5f5',
  border: '1px solid #9c27b0',
  borderRadius: '4px',
  padding: '0.75rem 1rem',
  maxWidth: '400px',
};

const adminNoticeTextStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#7b1fa2',
};

const popupHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.5rem',
};

const deleteMarkerButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '0.25rem',
  borderRadius: '3px',
  marginLeft: '0.5rem',
};

const createdByStyle = {
  fontSize: '0.75rem',
  color: '#888',
  margin: '0.5rem 0 0 0',
  fontStyle: 'italic',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '8px',
  maxWidth: '800px',
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const modalTitleStyle = {
  margin: '0 0 1rem 0',
  fontSize: '1.5rem',
  color: '#333',
};

const coordinatesStyle = {
  margin: '0 0 1.5rem 0',
  fontSize: '0.9rem',
  color: '#666',
  fontFamily: 'monospace',
};

const formGroupStyle = {
  marginBottom: '1.5rem',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 'bold',
  color: '#333',
};

const subLabelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: '#555',
  fontSize: '0.9rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  resize: 'vertical',
  minHeight: '80px',
};

const fileInputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const mediaInputSectionStyle = {
  marginBottom: '1rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  border: '1px solid #e9ecef',
};

const youtubeInputContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const addVideoButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#ff0000',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  transition: 'background-color 0.2s',
};

const helperTextStyle = {
  fontSize: '0.8rem',
  color: '#666',
  marginTop: '0.5rem',
  fontStyle: 'italic',
};

const iconPreviewContainerStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'center',
};

const contentPreviewContainerStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
};

const previewLabelStyle = {
  fontSize: '0.9rem',
  fontWeight: 'bold',
  color: '#555',
  margin: '0 0 0.5rem 0',
};

const iconPreviewStyle = {
  width: '40px',
  height: '40px',
  objectFit: 'cover',
  borderRadius: '50%',
  border: '3px solid #007bff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
};

const previewGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: '0.5rem',
  marginTop: '0.5rem',
};

const previewItemContainerStyle = {
  position: 'relative',
  display: 'inline-block',
};

const previewItemStyle = {
  position: 'relative',
  display: 'inline-block',
};

const contentPreviewStyle = {
  width: '100px',
  height: '75px',
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid #ddd',
};

const videoIndicatorStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white',
  fontSize: '20px',
  textShadow: '0 0 4px rgba(0,0,0,0.8)',
  pointerEvents: 'none',
};

const typeIndicatorStyle = {
  position: 'absolute',
  top: '2px',
  left: '2px',
  fontSize: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '2px',
  padding: '1px 3px',
};

const removeButtonStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '2rem',
};

const submitButtonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const cancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const popupContentStyle = {
  textAlign: 'center',
};

const popupTitleStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.3rem',
  color: '#333',
  fontWeight: 'bold',
};

const popupDescriptionStyle = {
  margin: '0 0 1rem 0',
  fontSize: '0.9rem',
  color: '#555',
  lineHeight: '1.4',
};

const mainMediaStyle = {
  width: '100%',
  maxHeight: '250px',
  borderRadius: '4px',
  marginBottom: '0.5rem',
};

const mediaGalleryStyle = {
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  padding: '0.5rem 0',
};

const galleryItemStyle = {
  minWidth: '120px',
  height: '80px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
  position: 'relative',
};

const galleryThumbnailStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '4px',
};

const galleryCountStyle = {
  fontSize: '0.8rem',
  color: '#666',
  margin: '0.5rem 0 0 0',
};

const popupCoordsStyle = {
  margin: '1rem 0 0 0',
  fontSize: '0.8rem',
  color: '#666',
  fontFamily: 'monospace',
}; 