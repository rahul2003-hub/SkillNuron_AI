import { useState, useRef, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle, TrendingUp, Award, Brain, Zap, Eye, FileCheck, AlertTriangle, Upload, X, Loader2, Sparkles, Download, Clock } from 'lucide-react';
import { analyzeResume, analyzeResumeFromText, saveResumeAnalysis, getResumeHistory, getResumeDownloadUrl } from '../services/api';

interface ResumeAnalyzerProps {
  userId?: string;
}

export function ResumeAnalyzer({ userId }: ResumeAnalyzerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (userId) getResumeHistory(userId).then(d => setHistory(d.analyses ?? [])).catch(() => {});
  }, [userId, isAnalyzed]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); processResume(file); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) { setUploadedFile(file); processResume(file); }
  };

  const processResume = async (file: File) => {
    setIsProcessing(true);
    setIsAnalyzed(false);
    setError('');
    setAnalysisData(null);
    setShowTextFallback(false);

    try {
      const data = await analyzeResume(file);
      setAnalysisData(data.analysis);
      setIsAnalyzed(true);
      saveResumeAnalysis(data.analysis?.overall_score ?? 0, data.analysis, data.resume_path, file.name).catch(
        (e) => console.error('Failed to save resume analysis:', e)
      );
    } catch (err: any) {
      // PDF text extraction failed — show paste fallback
      if (err.message === 'PDF_TEXT_EXTRACTION_FAILED') {
        setShowTextFallback(true);
        setError('');
      } else {
        setError(err.message || 'Resume analysis failed. Make sure your backend is running.');
      }
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const processFromText = async () => {
    if (!pastedText.trim() || pastedText.length < 30) {
      setError('Please paste more resume content before analyzing.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const data = await analyzeResumeFromText(pastedText);
      setAnalysisData(data.analysis);
      setIsAnalyzed(true);
      setShowTextFallback(false);
      saveResumeAnalysis(data.analysis?.overall_score ?? 0, data.analysis, null, 'pasted_text.txt').catch(
        (e) => console.error('Failed to save resume analysis:', e)
      );
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    setIsAnalyzed(false);
    setAnalysisData(null);
    setError('');
    setShowTextFallback(false);
    setPastedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-base-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-linear-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl text-base-content">AI Resume Analyzer</h2>
        </div>
        <p className="text-base-content/70">Upload your PDF resume and get real AI-powered scores, keyword analysis and improvement tips.</p>
      </div>

      {/* Generic Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-error text-sm font-medium">Something went wrong</p>
            <p className="text-error text-sm mt-1">{error}</p>
            <button onClick={handleReset} className="mt-2 text-sm text-error underline hover:text-error">
              Try again with a new file
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!uploadedFile && !isProcessing && !showTextFallback && !isAnalyzed && (
        <div className="bg-base-100 rounded-xl shadow-sm p-8">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-base-300 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl text-base-content mb-2">Drop your resume here</h3>
              <p className="text-base-content/70 mb-4">or click to browse</p>
              <button type="button" className="bg-linear-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all">
                Choose PDF File
              </button>
              <p className="text-sm text-base-content/60 mt-4">PDF · Max 10MB</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-base-100 rounded-xl shadow-sm p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-lg text-base-content mb-1">Analyzing your resume...</p>
              <p className="text-sm text-base-content/60">Groq AI is reading your resume. This takes 5–10 seconds.</p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">AI powered by qwen3.6</span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: PDF text extraction failed — offer paste option */}
      {showTextFallback && !isProcessing && (
        <div className="bg-base-100 rounded-xl shadow-sm p-6 space-y-4">
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-warning font-medium text-sm">Could not read your PDF automatically</p>
              <p className="text-warning text-sm mt-1">
                Some PDFs (especially from resume builders or design tools) use special formatting that prevents automatic reading.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base-content/80 font-medium">Choose how to proceed:</p>

            {/* Option 1: Upload different file */}
            <div className="border border-base-300 rounded-xl p-4">
              <p className="text-sm font-medium text-base-content mb-2">Option 1 — Upload a different PDF</p>
              <p className="text-xs text-base-content/60 mb-3">Use a PDF created from MS Word or Google Docs (File → Download as PDF)</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-base-200 text-base-content/80 rounded-lg hover:bg-base-300 transition-colors text-sm"
              >
                Upload New File
              </button>
            </div>

            {/* Option 2: Paste text */}
            <div className="border border-primary/30 rounded-xl p-4 bg-primary/10">
              <p className="text-sm font-medium text-base-content mb-2">Option 2 — Paste your resume text</p>
              <p className="text-xs text-base-content/60 mb-3">Open your resume, select all text (Ctrl+A), copy (Ctrl+C) and paste below</p>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={8}
                className="w-full px-4 py-3 border border-base-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-base-100"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-base-content/50">{pastedText.length} characters</span>
                <button
                  onClick={processFromText}
                  disabled={pastedText.length < 30}
                  className="px-6 py-2 bg-linear-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isAnalyzed && analysisData && (
        <>
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-base-content">{uploadedFile?.name || 'Resume (pasted text)'}</p>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analyzed successfully by Groq AI</span>
                  </div>
                </div>
              </div>
              <button onClick={handleReset} className="text-base-content/50 hover:text-error transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-linear-to-br from-primary to-secondary rounded-xl shadow-lg p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl mb-2 opacity-90">Overall Resume Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl">{analysisData.overall_score}</span>
                  <span className="text-2xl opacity-75">/100</span>
                </div>
                <p className="mt-2 opacity-90 text-sm">{analysisData.summary}</p>
              </div>
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="white" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysisData.overall_score / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-6">Score Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'ATS Compatibility', value: analysisData.ats_compatibility },
                { label: 'Content Quality', value: analysisData.content_quality },
                { label: 'Formatting', value: analysisData.formatting },
                { label: 'Keyword Optimization', value: analysisData.keyword_optimization },
                { label: 'Impact Score', value: analysisData.impact_score },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base-content/80">{label}</span>
                    <span className={getScoreColor(value)}>{value}%</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div className={`${getScoreBgColor(value)} h-2 rounded-full`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-base-100 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <h3 className="text-lg text-base-content">Strengths</h3>
              </div>
              <div className="space-y-4">
                {analysisData.strengths?.map((s: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="text-base-content mb-1 text-sm font-medium">{s.title}</h4>
                      <p className="text-sm text-base-content/70">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h3 className="text-lg text-base-content">Areas for Improvement</h3>
              </div>
              <div className="space-y-4">
                {analysisData.improvements?.map((imp: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-base-content">{imp.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${imp.severity === 'high' ? 'bg-error/20 text-error' :
                          imp.severity === 'medium' ? 'bg-warning/20 text-warning' :
                            'bg-warning/10 text-warning'}`}>
                          {imp.severity}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70">{imp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keyword Analysis */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-6">Keyword Analysis</h3>
            <div className="space-y-5">
              {[
                { icon: <CheckCircle className="w-5 h-5 text-success" />, label: 'Keywords Present', items: analysisData.keywords_present, style: 'bg-success/20 text-success' },
                { icon: <XCircle className="w-5 h-5 text-error" />, label: 'Missing High-Value Keywords', items: analysisData.keywords_missing, style: 'bg-error/20 text-error' },
                { icon: <Eye className="w-5 h-5 text-info" />, label: 'Recommended Keywords', items: analysisData.keywords_recommended, style: 'bg-info/20 text-info' },
              ].map(({ icon, label, items, style }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-3">{icon}<h4 className="text-base-content">{label}</h4></div>
                  <div className="flex flex-wrap gap-2">
                    {items?.map((k: string, i: number) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-sm ${style}`}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleReset} className="w-full border-2 border-primary text-primary py-3 rounded-lg hover:bg-primary/10 transition-all">
            Analyze Another Resume
          </button>
        </>
      )}

      {/* Past Analyses */}
      {history.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-sm gap-2"><Clock className="w-4 h-4 text-base-content/50" />Past Analyses</h3>
            <div className="divide-y divide-base-200">
              {history.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2.5">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm truncate">{r.filename || 'Resume'}</span>
                  <span className="text-xs text-base-content/40">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className={`badge badge-sm ${r.overall_score >= 80 ? 'badge-success' : r.overall_score >= 60 ? 'badge-warning' : 'badge-error'}`}>{r.overall_score}</div>
                  {r.resume_path && (
                    <button className="btn btn-ghost btn-xs btn-square" title="Download" onClick={async () => { try { const { url } = await getResumeDownloadUrl(r.resume_path); window.open(url, '_blank'); } catch {} }}>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}