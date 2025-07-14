require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Pre-flight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working' });
});

// Extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF parsing error:', err);
    throw new Error('Failed to parse PDF');
  }
}

// API endpoint for resume analysis
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  console.log('Analysis request received');
  
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const jobDescription = req.body.jobDescription;
    if (!jobDescription) {
      console.log('No job description provided');
      return res.status(400).json({ error: 'Job description is required' });
    }

    console.log('Extracting text from PDF...');
    const resumeText = await extractTextFromPDF(req.file.buffer);

    const prompt = `
    Analyze this resume against the provided job description:

    Resume:
    ${resumeText.substring(0, 10000)} [truncated if too long]

    Job Description:
    ${jobDescription.substring(0, 5000)} [truncated if too long]

    Provide a detailed analysis with:
    1. Match Percentage (0-100%)
    2. Top Matching Skills
    3. Missing Qualifications
    4. Improvement Suggestions
    5. Final Recommendation

    Format the response in HTML with proper headings and lists.
    `;

    console.log('Sending request to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisResult = response.text();

    console.log('Analysis completed successfully');
    res.status(200).json({ 
      success: true,
      result: analysisResult,
      matchScore: extractMatchScore(analysisResult) 
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze resume',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Helper function to extract match score from analysis
function extractMatchScore(analysisText) {
  const matchRegex = /Match Percentage: (\d+)%/i;
  const match = analysisText.match(matchRegex);
  return match ? parseInt(match[1]) : null;
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});