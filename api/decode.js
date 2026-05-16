export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get environment variables
    const apiKey = process.env.WATSONX_API_KEY;
    const projectId = process.env.WATSONX_PROJECT_ID;
    const endpoint = process.env.WATSONX_ENDPOINT;
    const model = process.env.WATSONX_MODEL;

    if (!apiKey || !projectId || !endpoint || !model) {
      return res.status(500).json({ error: 'Server configuration error: Missing environment variables' });
    }

    // Step 1: Get IAM token
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('IAM token error:', errorText);
      return res.status(500).json({ error: 'Failed to authenticate with IBM Cloud' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Call watsonx.ai text generation API
    const watsonxUrl = `${endpoint}/ml/v1/text/generation?version=2023-05-29`;
    
    const watsonxResponse = await fetch(watsonxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        model_id: model,
        input: prompt,
        parameters: {
          max_new_tokens: 1000,
          decoding_method: 'greedy'
        },
        project_id: projectId
      })
    });

    if (!watsonxResponse.ok) {
      const errorData = await watsonxResponse.json().catch(() => ({}));
      console.error('Watsonx API error:', errorData);
      return res.status(500).json({ error: errorData.message || 'Failed to generate response from watsonx.ai API' });
    }

    const watsonxData = await watsonxResponse.json();
    const generatedText = watsonxData.results[0].generated_text;

    // Strip markdown code fences
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse as JSON, fallback to plain text for follow-up questions
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedText);
    } catch (error) {
      // If JSON parsing fails, return the raw text (for follow-up questions)
      parsedResult = cleanedText;
    }

    // Return the result
    return res.status(200).json({ result: parsedResult });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Made with Bob
