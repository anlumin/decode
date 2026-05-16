/**
 * Build a prompt for watsonx.ai based on the input text and type
 * @param {string} text - The text to analyze
 * @param {string} type - The type of text (assignment, feedback, requirement, code_review)
 * @returns {string} - The formatted prompt for the AI
 */
function buildPrompt(text, type) {
  const typeInstructions = {
    assignment: {
      context: "an academic assignment brief or instruction from a professor or teacher",
      focus: "what the student needs to deliver, what criteria will be used for grading, and what success looks like"
    },
    feedback: {
      context: "professional feedback from a manager or colleague on someone's work",
      focus: "what specific changes are being requested, what the underlying concern is, and what would satisfy the feedback giver"
    },
    requirement: {
      context: "a project requirement from a client or stakeholder",
      focus: "what deliverable is expected, what constraints exist, and what would constitute successful completion"
    },
    code_review: {
      context: "a technical comment from a code reviewer",
      focus: "what code changes are needed, what the technical concern is, and what would make the code acceptable"
    }
  };

  const instruction = typeInstructions[type] || typeInstructions.assignment;

  return `You are an expert at analyzing unclear or ambiguous communication. You will receive ${instruction.context}.

Your task is to analyze the following text and extract clarity from it. Focus on ${instruction.focus}.

TEXT TO ANALYZE:
"""
${text}
"""

You must return ONLY a valid JSON object with exactly these four keys:

1. "what_asked" (string): A clear, plain-English restatement of what is actually being requested. Strip away jargon and vagueness. Be specific and direct.

2. "unclear_or_missing" (array of strings): List 3-5 specific gaps, ambiguities, or unstated assumptions in the text. Each item should identify something concrete that is unclear or missing.

3. "questions_to_ask" (array of strings): Provide exactly 3 clarifying questions that would help resolve the ambiguity. These should be specific, answerable questions that would unblock the person receiving this text.

4. "success_looks_like" (string): A single, clear sentence that defines what a great response to this text would achieve. Focus on the outcome, not the process.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON
- Do NOT include markdown code fences like \`\`\`json
- Do NOT include any explanatory text before or after the JSON
- Do NOT include comments in the JSON
- Ensure all strings are properly escaped
- The response must be parseable by JSON.parse()

Return your analysis now:`;

/**
 * Build a follow-up prompt that includes context from the original text and clarity report
 * @param {string} originalText - The original text that was analyzed
 * @param {object} clarityReport - The clarity report object with what_asked, unclear_or_missing, etc.
 * @param {string} question - The user's follow-up question
 * @returns {string} - The formatted prompt for the AI
 */
function buildFollowUpPrompt(originalText, clarityReport, question) {
  return `You are Bob, an expert communication advisor helping someone understand and respond to unclear text.

CONTEXT - Original text that was analyzed:
"""
${originalText}
"""

CONTEXT - Clarity analysis that was provided:
- What's actually being asked: ${clarityReport.what_asked}
- What's unclear or missing: ${clarityReport.unclear_or_missing.join('; ')}
- Questions worth asking back: ${clarityReport.questions_to_ask.join('; ')}
- What success looks like: ${clarityReport.success_looks_like}

USER'S FOLLOW-UP QUESTION:
"""
${question}
"""

Provide a clear, actionable, and helpful answer to the user's question. Consider the full context of both the original text and the clarity analysis. Your response should be:
- Direct and practical
- Specific to their situation
- Written in a friendly but professional tone
- Focused on helping them take action

Respond naturally in plain text (not JSON). Keep your answer concise but complete.`;
}
}

// Made with Bob
