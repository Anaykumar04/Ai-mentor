const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
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
    let resultJson;
    try {
      resultJson = JSON.parse(jsonStr);
    } catch (e) {
      console.error('AI JSON Parse Error:', text);
      throw new Error('AI returned invalid format');
    }

    res.json(resultJson);
  } catch (error) {
    console.error('Gemini Analysis Error:', error.message);
    res.status(200).json({ 
      error: 'AI Analysis limited',
      isSuccess: false,
      errorFound: 'AI Mentor busy',
      hints: ['Check your logic carefully'],
      explanation: 'The AI Mentor is currently offline or busy. Try running your code again.',
      optimizationTip: 'Focus on clean code structure.',
      score: 50,
      feedback: 'Keep going!'
    });
  }
};

// Helper: run a shell command and return { stdout, stderr, exitCode }
const runShellCommand = (cmd, timeoutMs = 8000) => {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: err ? (stderr || err.message) : (stderr || ''),
        exitCode: err ? (err.code || 1) : 0,
      });
    });
  });
};

// Helper: try remote execution if local fails
const tryRemoteExecution = async (language, code) => {
  const pistonLangMap = {
    python:     { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    java:       { language: 'java', version: '15.0.2' },
    cpp:        { language: 'c++',  version: '10.2.0' },
  };
  const pistonLang = pistonLangMap[language] || pistonLangMap['python'];
  try {
    const pistonRes = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: pistonLang.language,
      version:  pistonLang.version,
      files: [{ content: code }],
      stdin: '', run_timeout: 8000, compile_timeout: 10000,
    }, { timeout: 15000 });

    const runResult  = pistonRes.data.run;
    const compResult = pistonRes.data.compile;
    return {
      stdout:   runResult?.stdout  || '',
      stderr:   runResult?.stderr  || compResult?.stderr || '',
      exitCode: runResult?.code    ?? 0,
    };
  } catch (pistonErr) {
    return {
      stdout: '',
      stderr: `Execution Error: Local compiler not found AND remote compiler service unreachable. Please install a local compiler (like g++ or javac) or check your internet connection.`,
      exitCode: 1,
    };
  }
};

exports.runCode = async (req, res) => {
  const { code, language = 'python' } = req.body;
  console.log(`[EXEC] Running ${language} code...`);

  // Write code to a temp file
  const tmpDir  = os.tmpdir();
  const extMap  = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' };
  const ext     = extMap[language] || 'py';
  const tmpFile = path.join(tmpDir, `ai_mentor_code_${Date.now()}.${ext}`);

  try {
    fs.writeFileSync(tmpFile, code, 'utf-8');

    let result;

    if (language === 'python') {
      // Run Python locally
      result = await runShellCommand(`python "${tmpFile}"`);
      if (result.exitCode !== 0 && !result.stderr) {
        // Try python3 if python doesn't work
        result = await runShellCommand(`python3 "${tmpFile}"`);
      }
    } else if (language === 'javascript') {
      // Run JavaScript locally with Node.js
      result = await runShellCommand(`node "${tmpFile}"`);
    } else if (language === 'cpp') {
      // Local C++ Execution (requires g++ in PATH)
      const executable = path.join(tmpDir, `ai_mentor_cpp_${Date.now()}.exe`);
      const compileRes = await runShellCommand(`g++ "${tmpFile}" -o "${executable}"`, 10000);
      
      if (compileRes.exitCode === 0) {
        result = await runShellCommand(`"${executable}"`);
        try { fs.unlinkSync(executable); } catch (_) {}
      } else {
        // Compile failed or g++ missing
        if (compileRes.stderr.toLowerCase().includes("'g++' is not recognized") || compileRes.stderr.includes("not found")) {
          // Fallback to Piston if local g++ is missing
          result = await tryRemoteExecution(language, code);
        } else {
          result = { stdout: '', stderr: compileRes.stderr, exitCode: 1 };
        }
      }
    } else if (language === 'java') {
      // Local Java Execution (requires javac/java in PATH)
      // Note: This assumes the class is 'Solution', matching starter code
      const javaTmpDir = path.join(tmpDir, `java_${Date.now()}`);
      try {
        fs.mkdirSync(javaTmpDir);
        const javaFile = path.join(javaTmpDir, 'Solution.java');
        fs.writeFileSync(javaFile, code);
        
        const compileRes = await runShellCommand(`javac "${javaFile}"`, 10000);
        if (compileRes.exitCode === 0) {
          result = await runShellCommand(`java -cp "${javaTmpDir}" Solution`);
        } else {
          if (compileRes.stderr.toLowerCase().includes("'javac' is not recognized") || compileRes.stderr.includes("not found")) {
            result = await tryRemoteExecution(language, code);
          } else {
            result = { stdout: '', stderr: compileRes.stderr, exitCode: 1 };
          }
        }
      } catch (err) {
        result = await tryRemoteExecution(language, code);
      } finally {
        try { fs.rmSync(javaTmpDir, { recursive: true, force: true }); } catch (_) {}
      }
    } else {
      result = await tryRemoteExecution(language, code);
    }

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch (_) {}

    const hasError = result.exitCode !== 0 || !!result.stderr;

    return res.json({
      stdout:         result.stdout  || null,
      stderr:         result.stderr  || null,
      compile_output: null,
      status: {
        id:          hasError ? 11 : 3,
        description: hasError ? 'Runtime Error' : 'Accepted',
      }
    });

  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    console.error('Local execution error:', err.message);
    return res.json({
      stdout: null,
      stderr: `Execution error: ${err.message}`,
      status: { id: 13, description: 'Internal Error' }
    });
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
