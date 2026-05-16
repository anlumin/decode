// State management
let selectedType = 'assignment';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeTypeButtons();
  initializeDecodeButton();
});

// Initialize type selector buttons
function initializeTypeButtons() {
  const typeButtons = document.querySelectorAll('.type-btn');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });
}

// Initialize decode button
function initializeDecodeButton() {
  const decodeBtn = document.getElementById('decodeBtn');
  if (decodeBtn) {
    decodeBtn.addEventListener('click', runDecode);
  }
}

// Main decode function
async function runDecode() {
  const pasteInput = document.getElementById('pasteInput');
  const loader = document.getElementById('loader');
  const errorMsg = document.getElementById('errorMsg');
  
  // Clear previous errors
  errorMsg.textContent = '';
  errorMsg.style.display = 'none';
  
  // Validate input
  const inputText = pasteInput.value.trim();
  if (!inputText) {
    showError('Please paste some text to decode.');
    return;
  }
  
  if (inputText.length < 20) {
    showError('Please provide at least 20 characters of text.');
    return;
  }
  
  // Show loader
  loader.classList.add('active');
  
  try {
    // Build prompt using the external buildPrompt function
    const prompt = buildPrompt(inputText, selectedType);
    
    // Call serverless function
    const response = await callDecodeAPI(prompt);
    
    // Parse and render results
    renderResults(inputText, response);
    
    // Switch to output screen
    switchToOutputScreen();
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message || 'An error occurred while processing your request. Please try again.');
  } finally {
    // Hide loader
    loader.classList.remove('active');
  }
}

// Call serverless decode API
async function callDecodeAPI(prompt) {
  const response = await fetch('/api/decode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to process request. Please try again.');
  }
  
  const data = await response.json();
  return data.result;
}

// Render results to output screen
function renderResults(originalText, data) {
  const inputEcho = document.getElementById('inputEcho');
  const reportContainer = document.getElementById('reportContainer');
  
  // Show original text preview
  inputEcho.textContent = originalText.substring(0, 200) + (originalText.length > 200 ? '...' : '');
  
  // Clear previous results
  reportContainer.innerHTML = '';
  
  // Render the four sections
  const sections = [
    {
      title: "What's actually being asked",
      marker: '◎',
      markerClass: 'marker-target',
      content: data.what_asked,
      isArray: false
    },
    {
      title: "What's unclear or missing",
      marker: '△',
      markerClass: 'marker-warn',
      content: data.unclear_or_missing,
      isArray: true
    },
    {
      title: "Questions worth asking back",
      marker: '?',
      markerClass: 'marker-ask',
      content: data.questions_to_ask,
      isArray: true
    },
    {
      title: "What success looks like",
      marker: '✓',
      markerClass: 'marker-success',
      content: data.success_looks_like,
      isArray: false
    }
  ];
  
  sections.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'report-section';
    
    const header = document.createElement('div');
    header.className = 'report-header';
    
    const marker = document.createElement('div');
    marker.className = `report-marker ${section.markerClass}`;
    marker.textContent = section.marker;
    
    const title = document.createElement('div');
    title.className = 'report-title';
    title.textContent = section.title;
    
    header.appendChild(marker);
    header.appendChild(title);
    
    const body = document.createElement('div');
    body.className = 'report-body';
    
    if (section.isArray) {
      if (Array.isArray(section.content) && section.content.length > 0) {
        section.content.forEach(item => {
          const p = document.createElement('p');
          p.textContent = escapeHtml(item);
          body.appendChild(p);
        });
      } else {
        const p = document.createElement('p');
        p.textContent = 'None identified.';
        body.appendChild(p);
      }
    } else {
      const p = document.createElement('p');
      p.textContent = escapeHtml(section.content);
      body.appendChild(p);
    }
    
    sectionDiv.appendChild(header);
    sectionDiv.appendChild(body);
    reportContainer.appendChild(sectionDiv);
  });
}

// Switch to output screen
function switchToOutputScreen() {
  const inputScreen = document.getElementById('inputScreen');
  const outputScreen = document.getElementById('outputScreen');
  
  inputScreen.style.display = 'none';
  outputScreen.style.display = 'block';
}

// Go back to input screen
function goBack() {
  const inputScreen = document.getElementById('inputScreen');
  const outputScreen = document.getElementById('outputScreen');
  
  outputScreen.style.display = 'none';
  inputScreen.style.display = 'block';
}

// Show error message
function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Made with Bob
