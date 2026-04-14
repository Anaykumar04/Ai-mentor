const axios = require('axios');
const UserProgress = require('../models/UserProgress');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");

// Judge0 language mapping
const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54
};

exports.analyzeCode = async (req, res) => {
  try {
    const { problem, code, error, language = 'python' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required for analysis' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are an expert AI Coding Mentor for students learning programming.
Language being analyzed: ${language.toUpperCase()}

Your strict responsibilities:
1. DETECT: Syntax errors, runtime errors, logical mistakes, edge case failures
2. ANALYZE: Identify inefficient approaches (time/space complexity issues)  
3. GUIDE: Provide PROGRESSIVE, PEDAGOGICAL hints — NEVER the full solution or complete code
4. MENTOR: Explain WHY something is wrong, not just WHAT is wrong
5. ENCOURAGE: Keep feedback motivating and constructive

ABSOLUTE RULES:
- NEVER write a complete working solution
- NEVER provide more than a directional hint
- Hints must guide students to THINK, not copy
- Focus on teaching concepts, not giving answers

Return ONLY this exact JSON (no markdown, no backticks):
{
  "isSuccess": boolean,
  "errorFound": "Specific description of the bug/issue, or 'None - solution looks correct' if passing",
  "hints": [
    "Hint 1: Conceptual direction (what to think about, not how to do it)",
    "Hint 2: More specific direction about the approach",
    "Hint 3: Near-solution guidance that still requires student effort"
  ],
  "explanation": "Deep educational explanation of the concept and why the error occurs",
  "optimizationTip": "Specific advice about time/space complexity improvement — no code",
  "score": number between 0 and 100,
  "feedback": "Encouraging, specific feedback about strengths and areas to improve"
}`;

    const userPrompt = `
Problem Statement: ${problem || 'General coding practice'}
Programming Language: ${language}

Student's Code:
\`\`\`${language}
${code}
\`\`\`

Execution Output / Error (if any):
${error || 'No execution attempted yet'}

Analyze the code thoroughly.`;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({
        "isSuccess": false,
        "errorFound": "API Key Missing",
        "hints": ["Visit AI Studio to get your Gemini API Key", "Add it to the .env file in the backend"],
        "explanation": "The mentorship system requires an active Gemini API key to perform real-time code analysis.",
        "optimizationTip": "Set up your environment variables.",
        "score": 0,
        "feedback": "Admin setup required for live mentorship."
      });
    }

    const result = await model.generateContent(systemPrompt + "\n" + userPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from AI
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultJson = JSON.parse(jsonStr);

    res.json(resultJson);
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({ error: 'AI Analysis Node Offline: Failed to communicate with Gemini' });
  }
};

exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    // Language mapping for Piston API (free, no key required)
    const pistonLangMap = {
      python:     { language: 'python',     version: '3.10.0' },
      javascript: { language: 'javascript', version: '18.15.0' },
      java:       { language: 'java',       version: '15.0.2' },
      cpp:        { language: 'c++',        version: '10.2.0' },
    };

    const pistonLang = pistonLangMap[language] || pistonLangMap['python'];

    // Use Piston API — free, open-source, no API key required
    const pistonResponse = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: pistonLang.language,
      version:  pistonLang.version,
      files: [{ content: code }],
      stdin: '',
      run_timeout: 5000,
      compile_timeout: 10000,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const runResult = pistonResponse.data.run;
    const compileResult = pistonResponse.data.compile;

    // Determine output: stdout, stderr, or compile error
    const stdout = runResult?.stdout || '';
    const stderr = runResult?.stderr || compileResult?.stderr || '';
    const exitCode = runResult?.code ?? 0;

    return res.json({
      stdout: stdout || null,
      stderr: stderr || null,
      compile_output: compileResult?.stderr || null,
      status: {
        id: exitCode === 0 ? 3 : 11,
        description: exitCode === 0 ? 'Accepted' : 'Runtime Error'
      }
    });
  } catch (err) {
    console.error('Piston execution error:', err.message);
    // Fallback if Piston is unreachable
    return res.json({
      stdout: null,
      stderr: 'Code execution service temporarily unavailable. Please check your internet connection.',
      status: { id: 13, description: 'Service Unavailable' }
    });
  }
};

// OLD Judge0 path (kept for future reference, replaced by Piston above)
const _oldRunCodeWithJudge0 = async (req, res) => {
  try {
    const { code, language } = req.body;
    const languageId = languageMap[language] || 63;
    const options = {
      method: 'POST',
      url: `${process.env.JUDGE0_URL}/submissions`,
      params: { base64_encoded: 'false', fields: '*' },
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: {
        language_id: languageId,
        source_code: code,
      }
    };

    const submission = await axios.request(options);
    const token = submission.data.token;

    let result;
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const getOptions = {
        method: 'GET',
        url: `${process.env.JUDGE0_URL}/submissions/${token}`,
        params: { base64_encoded: 'false', fields: '*' },
        headers: {
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      };
      
      const checkRes = await axios.request(getOptions);
      if (checkRes.data.status.id !== 1 && checkRes.data.status.id !== 2) {
        result = checkRes.data;
        break;
      }
      attempts++;
    }

    if (!result) {
      return res.status(504).json({ error: 'Timeout waiting for Judge0' });
    }

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
    });
  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const { problemTitle, language, code, status, userId } = req.body;
    
    const progress = new UserProgress({
      userId: userId || 'guest',
      problemTitle,
      language,
      code,
      status
    });
    
    await progress.save();

    if (status === 'Success' && userId && userId !== 'guest') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });
    }

    res.status(201).json({ message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const history = await UserProgress.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};
