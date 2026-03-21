import { useState, useRef } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle, TrendingUp, Target, Award, Brain, Zap, Eye, FileCheck, AlertTriangle, Upload, X, Loader2, Sparkles } from 'lucide-react';

export function ResumeAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock analysis data
  const overallScore = 78;
  const analysisData = {
    atsCompatibility: 85,
    contentQuality: 75,
    formatting: 80,
    keywordOptimization: 70,
    impactScore: 76,
  };

  const strengths = [
    {
      title: 'Strong Technical Skills Section',
      description: 'Well-organized skills with relevant technologies for your target role.',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Quantified Achievements',
      description: 'Good use of metrics and numbers to demonstrate impact.',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'ATS-Friendly Format',
      description: 'Resume structure is compatible with Applicant Tracking Systems.',
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const improvements = [
    {
      title: 'Missing Keywords',
      description: 'Add more industry-specific keywords like "CI/CD", "Docker", "Kubernetes" to improve ATS match.',
      severity: 'medium',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Professional Summary Too Generic',
      description: 'Make your summary more specific to your target role and unique value proposition.',
      severity: 'medium',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Limited Action Verbs',
      description: 'Use stronger action verbs like "spearheaded", "orchestrated", "engineered" instead of repetitive words.',
      severity: 'low',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const sectionAnalysis = [
    {
      section: 'Contact Information',
      score: 100,
      status: 'excellent',
      feedback: 'All essential contact details are present and properly formatted.',
    },
    {
      section: 'Professional Summary',
      score: 70,
      status: 'good',
      feedback: 'Summary is present but could be more tailored and impactful.',
    },
    {
      section: 'Work Experience',
      score: 80,
      status: 'good',
      feedback: 'Good descriptions with quantifiable results. Consider adding more recent achievements.',
    },
    {
      section: 'Skills',
      score: 85,
      status: 'excellent',
      feedback: 'Well-categorized with relevant technical and soft skills.',
    },
    {
      section: 'Education',
      score: 90,
      status: 'excellent',
      feedback: 'Clear and concise. Includes relevant certifications.',
    },
  ];

  const keywords = {
    present: ['JavaScript', 'React', 'Python', 'Machine Learning', 'Agile', 'Leadership', 'Problem Solving'],
    missing: ['Docker', 'Kubernetes', 'CI/CD', 'Microservices', 'Cloud Architecture'],
    recommended: ['AWS', 'Azure', 'DevOps', 'Test Automation', 'System Design'],
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      processResume(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setUploadedFile(file);
      processResume(file);
    }
  };

  const processResume = async (file: File) => {
    setIsProcessing(true);
    setIsAnalyzed(false);

    // Simulate AI processing and analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setIsAnalyzed(true);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    setIsAnalyzed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      average: 'bg-orange-100 text-orange-700',
      poor: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || styles.average;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-2xl text-gray-900">AI Resume Analyzer</h2>
        </div>
        <p className="text-gray-600">
          Upload your resume and get comprehensive AI-powered insights and recommendations to optimize it for better job matches.
        </p>
      </div>

      {/* Upload Section */}
      {!uploadedFile && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg text-gray-900">Upload Your Resume</h3>
          </div>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleBrowse();
              }
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
            onClick={handleBrowse}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Drop your resume here</h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <button
                type="button"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Choose File
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Processing State */}
      {uploadedFile && !isAnalyzed && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900">Analyzing Resume</h3>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 truncate">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-purple-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              <span className="text-gray-700">AI is analyzing your resume...</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Extracting content</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Analyzing ATS compatibility</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Evaluating keywords and content</span>
                <span>60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {isAnalyzed && uploadedFile && (
        <>
          {/* Uploaded File Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">{uploadedFile.name}</p>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analyzed successfully</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl mb-2 opacity-90">Overall Resume Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl">{overallScore}</span>
                  <span className="text-2xl opacity-75">/100</span>
                </div>
                <p className="mt-2 opacity-90">Your resume is performing well with room for improvement</p>
              </div>
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-gray-900 mb-6">Score Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">ATS Compatibility</span>
                  <span className={`${getScoreColor(analysisData.atsCompatibility)}`}>
                    {analysisData.atsCompatibility}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreBgColor(analysisData.atsCompatibility)} h-2 rounded-full transition-all`}
                    style={{ width: `${analysisData.atsCompatibility}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Content Quality</span>
                  <span className={`${getScoreColor(analysisData.contentQuality)}`}>
                    {analysisData.contentQuality}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreBgColor(analysisData.contentQuality)} h-2 rounded-full transition-all`}
                    style={{ width: `${analysisData.contentQuality}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Formatting</span>
                  <span className={`${getScoreColor(analysisData.formatting)}`}>
                    {analysisData.formatting}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreBgColor(analysisData.formatting)} h-2 rounded-full transition-all`}
                    style={{ width: `${analysisData.formatting}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Keyword Optimization</span>
                  <span className={`${getScoreColor(analysisData.keywordOptimization)}`}>
                    {analysisData.keywordOptimization}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreBgColor(analysisData.keywordOptimization)} h-2 rounded-full transition-all`}
                    style={{ width: `${analysisData.keywordOptimization}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Impact Score</span>
                  <span className={`${getScoreColor(analysisData.impactScore)}`}>
                    {analysisData.impactScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreBgColor(analysisData.impactScore)} h-2 rounded-full transition-all`}
                    style={{ width: `${analysisData.impactScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg text-gray-900">Strengths</h3>
              </div>
              <div className="space-y-4">
                {strengths.map((strength, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`w-10 h-10 ${strength.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <strength.icon className={`w-5 h-5 ${strength.color}`} />
                    </div>
                    <div>
                      <h4 className="text-gray-900 mb-1">{strength.title}</h4>
                      <p className="text-sm text-gray-600">{strength.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg text-gray-900">Areas for Improvement</h3>
              </div>
              <div className="space-y-4">
                {improvements.map((improvement, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`w-10 h-10 ${improvement.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <improvement.icon className={`w-5 h-5 ${improvement.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-gray-900">{improvement.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${improvement.severity === 'high' ? 'bg-red-100 text-red-700' :
                            improvement.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {improvement.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{improvement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section-by-Section Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-gray-900 mb-6">Section-by-Section Analysis</h3>
            <div className="space-y-4">
              {sectionAnalysis.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-gray-900">{section.section}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(section.status)}`}>
                        {section.status}
                      </span>
                    </div>
                    <span className={`${getScoreColor(section.score)}`}>
                      {section.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className={`${getScoreBgColor(section.score)} h-1.5 rounded-full transition-all`}
                      style={{ width: `${section.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{section.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-gray-900 mb-6">Keyword Analysis</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="text-gray-900">Keywords Present</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.present.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="text-gray-900">Missing High-Value Keywords</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.missing.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="text-gray-900">Recommended Keywords</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.recommended.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:shadow-lg transition-all">
              Download Detailed Report
            </button>
            <button
              onClick={handleRemoveFile}
              className="flex-1 border-2 border-purple-600 text-purple-600 py-3 rounded-lg hover:bg-purple-50 transition-all"
            >
              Analyze New Resume
            </button>
          </div>
        </>
      )}
    </div>
  );
}
