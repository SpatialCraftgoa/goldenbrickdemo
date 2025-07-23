import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user);
        setUsername('');
        setPassword('');
        onClose();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Login to Dubai Map</h2>
          <button onClick={handleClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={inputStyle}
              required
              disabled={loading}
            />
          </div>

          <div style={credentialsHintStyle}>
            <p style={hintTitleStyle}>Demo Credentials:</p>
            <p style={hintTextStyle}>
              <strong>Admin:</strong> username: admin, password: admin<br />
              <strong>Normal User:</strong> Any other credentials (view only)
            </p>
          </div>

          <div style={buttonContainerStyle}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...submitButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2000,
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '400px',
  margin: '20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 0 20px',
};

const titleStyle = {
  margin: 0,
  fontSize: '1.5rem',
  color: '#333',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
  padding: '0',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const formStyle = {
  padding: '20px',
};

const errorStyle = {
  backgroundColor: '#fee',
  color: '#c33',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '15px',
  fontSize: '14px',
  border: '1px solid #fcc',
};

const fieldStyle = {
  marginBottom: '15px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '16px',
  boxSizing: 'border-box',
};

const credentialsHintStyle = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  padding: '12px',
  marginBottom: '20px',
};

const hintTitleStyle = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#495057',
};

const hintTextStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#6c757d',
  lineHeight: '1.4',
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
};

const submitButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

const cancelButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}; 