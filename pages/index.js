import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import the DubaiMap component with SSR disabled
const DubaiMap = dynamic(() => import('../components/DubaiMap'), {
  ssr: false,
  loading: () => (
    <div style={loadingStyle}>
      <div style={loadingContentStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Loading Dubai Map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Dubai Interactive Map</title>
        <meta name="description" content="Interactive map of Dubai with click-to-add markers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{...mainStyle, backgroundColor: '#000'}}>
        <header style={{...headerStyle, backgroundColor: '#000', color: '#fff', padding: '3rem 3rem', borderBottom: '1px solid #dee2e6', textAlign: 'center', position: 'relative'}}>
          <img src="/GB_Logo_New-removebg-preview.png" alt="Golden Bricks Logo" style={{position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', width: '160px', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', background: 'transparent'}} />
          <img src="https://spatialcraft.in/wp-content/uploads/2024/04/New-Project-51-2.png" alt="Dubai Map" style={{position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', width: '200px', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)'}} />
        </header>
        
        <div style={mapContainerStyle}>
          <DubaiMap />
        </div>
      </main>
    </>
  );
}

// Styles
const mainStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
};

const headerStyle = {
  backgroundColor: '#f8f9fa',
  padding: '1rem 2rem',
  borderBottom: '1px solid #dee2e6',
  textAlign: 'center',
};

const titleStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '2rem',
  color: '#212529',
  fontWeight: '600',
};

const instructionStyle = {
  margin: '0',
  fontSize: '1.1rem',
  color: '#6c757d',
};

const mapContainerStyle = {
  flex: 1,
  minHeight: 'calc(100vh - 120px)',
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

// Add global styles for the spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
} 