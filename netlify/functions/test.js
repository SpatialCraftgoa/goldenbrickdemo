exports.handler = async (event, context) => {
  console.log('Simple test function called');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      message: 'Test function works!',
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    })
  };
};
