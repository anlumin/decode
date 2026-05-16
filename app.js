// State management
let selectedType = 'assignment';
let originalText = '';
let clarityReport = null;

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
    
    // Store original text and clarity report for follow-ups
    originalText = inputText;
    clarityReport = response;
    
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
  
  // Clear follow-up answers when going back
  const followupAnswers = document.getElementById('followupAnswers');
  if (followupAnswers) {
    followupAnswers.innerHTML = '';
  }
  
  // Clear follow-up input
  const followupInput = document.getElementById('followupInput');
  if (followupInput) {
    followupInput.value = '';
  }
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

// Follow-up question functionality
async function askFollowUp() {
  const followupInput = document.getElementById('followupInput');
  const followupLoader = document.getElementById('followupLoader');
  const followupBtn = document.getElementById('followupBtn');
  const followupAnswers = document.getElementById('followupAnswers');
  
  // Validate input
  const question = followupInput.value.trim();
  if (!question) {
    alert('Please enter a question.');
    return;
  }
  
  if (!originalText || !clarityReport) {
    alert('No clarity report available. Please decode text first.');
    return;
  }
  
  // Disable button and show loader
  followupBtn.disabled = true;
  followupLoader.classList.add('active');
  
  try {
    // Build follow-up prompt using the external buildFollowUpPrompt function
    const prompt = buildFollowUpPrompt(originalText, clarityReport, question);
    
    // Call serverless function
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
    
    // For follow-up questions, the response is plain text, not JSON
    // The API returns it in data.result which might be an object or string
    let answerText;
    if (typeof data.result === 'string') {
      answerText = data.result;
    } else if (data.result && data.result.generated_text) {
      answerText = data.result.generated_text;
    } else {
      answerText = JSON.stringify(data.result);
    }
    
    // Render the answer
    renderFollowUpAnswer(question, answerText);
    
    // Clear input
    followupInput.value = '';
    
  } catch (error) {
    console.error('Follow-up error:', error);
    alert(error.message || 'An error occurred while processing your question. Please try again.');
  } finally {
    // Re-enable button and hide loader
    followupBtn.disabled = false;
    followupLoader.classList.remove('active');
  }
}

// Render a follow-up answer
function renderFollowUpAnswer(question, answer) {
  const followupAnswers = document.getElementById('followupAnswers');
  
  const answerDiv = document.createElement('div');
  answerDiv.className = 'followup-answer';
  
  const questionDiv = document.createElement('div');
  questionDiv.className = 'followup-question';
  questionDiv.textContent = escapeHtml(question);
  
  const responseDiv = document.createElement('div');
  responseDiv.className = 'followup-response';
  
  // Split answer into paragraphs and render
  const paragraphs = answer.split('\n\n').filter(p => p.trim());
  paragraphs.forEach(para => {
    const p = document.createElement('p');
    p.textContent = escapeHtml(para.trim());
    responseDiv.appendChild(p);
  });
  
  answerDiv.appendChild(questionDiv);
  answerDiv.appendChild(responseDiv);
  followupAnswers.appendChild(answerDiv);
  
  // Scroll to the new answer
  answerDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
