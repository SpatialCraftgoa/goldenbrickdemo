exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'GET') {
    const availableIcons = {
      1: {
        filename: 'embedded.svg',
        url: '/static/images/markers/embedded.svg',
        size: [57, 86],
        anchor: [28.5, 43]
      },
      2: {
        filename: 'embedded_1.svg',
        url: '/static/images/markers/embedded_1.svg',
        size: [57, 57],
        anchor: [28.5, 28.5]
      },
      3: {
        filename: 'embedded_2.svg',
        url: '/static/images/markers/embedded_2.svg',
        size: [57, 86],
        anchor: [28.5, 43]
      },
      4: {
        filename: 'embedded_3.svg',
        url: '/static/images/markers/embedded_3.svg',
        size: [57, 86],
        anchor: [28.5, 43]
      },
      5: {
        filename: 'embedded_4.svg',
        url: '/static/images/markers/embedded_4.svg',
        size: [57, 86],
        anchor: [28.5, 43]
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        icons: availableIcons,
        count: Object.keys(availableIcons).length
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ message: 'Method not allowed' })
  };
};
