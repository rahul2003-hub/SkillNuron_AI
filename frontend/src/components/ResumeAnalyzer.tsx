import { useState, useRef, useEffect } from 'react';
import {
  FileText, CheckCircle, AlertCircle, XCircle, TrendingUp, Award, Brain, Zap,
  Eye, FileCheck, AlertTriangle, Upload, X, Loader2, Sparkles, Download, Clock,
  FolderOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import { analyzeResume, analyzeResumeFromText, saveResumeAnalysis, getResumeHistory, getResumeDownloadUrl } from '../services/api';
 
interface ResumeAnalyzerProps {
  userId?: string;
}
 
interface ResumeEntry {
  id: string;
  overall_score: number;
  created_at: string;
  analysis: any;
  resume_path: string | null;
  filename: string | null;
}
 
type ViewTab = 'analyze' | 'history';
 
const scoreBadge = (score: number) =>
  score >= 80 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-error';
 
const scoreProgress = (score: number) =>
  score >= 80 ? 'progress-success' : score >= 60 ? 'progress-warning' : 'progress-error';
 
export function ResumeAnalyzer({ userId }: ResumeAnalyzerProps) {
  const [viewTab, setViewTab] = useState<ViewTab>('analyze');
 
  // --- Analyze tab state ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  // --- History tab state ---
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
 
  const loadHistory = () => {
    if (!userId) return;
    setHistoryLoading(true);
    getResumeHistory(userId)
      .then(data => setResumes(data.analyses ?? []))
      .catch(() => setHistoryError('Failed to load resume history'))
      .finally(() => setHistoryLoading(false));
  };
 
  // Refresh history whenever a new analysis completes, so the History tab
  // never needs its own polling and stays consistent with what was saved.
  useEffect(() => {
    loadHistory();
  }, [userId, isAnalyzed]);
 
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };
 
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
 
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };
 
  const processResume = async (file: File) => {
    setIsProcessing(true);
    setIsAnalyzed(false);
    setError('');
    setAnalysisData(null);
    setShowTextFallback(false);
 
    try {
      const data = await analyzeResume(file, targetRole, jobDescription);
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
      const data = await analyzeResumeFromText(pastedText, targetRole, jobDescription);
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
    setTargetRole('');
    setJobDescription('');
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
 
  const handleDownload = async (path: string, id: string) => {
    setDownloading(id);
    try {
      const { url } = await getResumeDownloadUrl(path);
      window.open(url, '_blank');
    } catch {
      setHistoryError('Download failed');
    } finally {
      setDownloading(null);
    }
  };
 
  const goToAnalyzeTab = () => {
    handleReset();
    setViewTab('analyze');
  };
 
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-base-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-linear-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl text-base-content">AI Resume Analyzer</h2>
            </div>
            <p className="text-base-content/70">Upload a resume and tailor the analysis to a target role or job description.</p>
          </div>
 
          {/* Tab Toggle */}
          <div className="bg-base-200 rounded-lg p-1 flex gap-1 shrink-0">
            <button
              onClick={() => setViewTab('analyze')}
              className={`px-4 py-2 rounded-md text-sm font-medium  ${viewTab === 'analyze' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content'
                }`}
            >
              Analyze
            </button>
            <button
              onClick={() => setViewTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium  ${viewTab === 'history' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content'
                }`}
            >
              My Resumes {resumes.length > 0 && `(${resumes.length})`}
            </button>
          </div>
        </div>
      </div>
 
      {/* ================= ANALYZE TAB ================= */}
      {viewTab === 'analyze' && (
        <>
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
 
          {/* Input dashboard */}
          {!uploadedFile && !isProcessing && !showTextFallback && !isAnalyzed && (
            <div className="bg-base-100 rounded-xl shadow-sm p-6 grid lg:grid-cols-2 gap-6">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-base-300 rounded-xl p-10 text-center hover:border-primary  cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl text-base-content mb-2">Drop your resume here</h3>
                  <p className="text-base-content/70 mb-4">or click to browse</p>
                  <button type="button" className="btn btn-primary">
                    Choose Resume
                  </button>
                  <p className="text-sm text-base-content/60 mt-4">PDF or TXT · Max 10MB</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,text/plain,application/pdf" onChange={handleFileSelect} className="hidden" />
              <div className="space-y-4">
                <div>
                  <label className="label"><span className="label-text font-medium">Target job title</span><span className="label-text-alt">Optional</span></label>
                  <input value={targetRole} onChange={e => setTargetRole(e.target.value)} className="input input-bordered w-full" placeholder="e.g. Python Backend Developer" />
                </div>
                <div>
                  <label className="label"><span className="label-text font-medium">Job description</span><span className="label-text-alt">Optional</span></label>
                  <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="textarea textarea-bordered w-full h-36" placeholder="Paste the role requirements to tailor keywords and recommendations..." />
                </div>
              </div>
            </div>
          )}

          {uploadedFile && !isProcessing && !isAnalyzed && (
            <div className="card bg-base-100 shadow-sm"><div className="card-body gap-4">
              <div className="flex items-center justify-between gap-3"><span className="font-medium truncate">{uploadedFile.name}</span><button onClick={handleReset} className="btn btn-ghost btn-sm">Remove</button></div>
              <div className="grid lg:grid-cols-2 gap-4"><input value={targetRole} onChange={e => setTargetRole(e.target.value)} className="input input-bordered w-full" placeholder="Target job title (optional)" /><textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="textarea textarea-bordered w-full h-24" placeholder="Job description (optional)" /></div>
              <button onClick={() => processResume(uploadedFile)} className="btn btn-primary self-start"><Sparkles className="w-4 h-4" /> Analyze resume</button>
            </div></div>
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
                  <span className="text-sm">AI powered by qwen3.8</span>
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
                    className="px-4 py-2 bg-base-200 text-base-content/80 rounded-lg hover:bg-base-300  text-sm"
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
                      className="px-6 py-2 bg-linear-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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
                  <button onClick={handleReset} className="text-base-content/50 hover:text-error ">
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
 
              <button onClick={handleReset} className="w-full border-2 border-primary text-primary py-3 rounded-lg hover:bg-primary/10 ">
                Analyze Another Resume
              </button>
            </>
          )}
        </>
      )}
 
      {/* ================= HISTORY TAB ================= */}
      {viewTab === 'history' && (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-base-content/60 text-sm">Loading your resumes…</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/15 rounded-lg grid place-items-center">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="card-title text-lg">My Resumes</h2>
                      <p className="text-sm text-base-content/60">{resumes.length} analysis{resumes.length !== 1 ? 'es' : ''} saved</p>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={goToAnalyzeTab}>
                    + Analyze New
                  </button>
                </div>
              </div>
 
              {/* Error */}
              {historyError && (
                <div className="alert alert-error shadow-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{historyError}</span>
                  <button className="btn btn-ghost btn-xs" onClick={() => setHistoryError('')}>✕</button>
                </div>
              )}
 
              {/* Empty State */}
              {resumes.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body items-center text-center py-16">
                    <FileText className="w-16 h-16 text-base-content/20 mb-4" />
                    <h3 className="text-lg font-semibold text-base-content/80">No resumes analyzed yet</h3>
                    <p className="text-sm text-base-content/50 max-w-sm">Upload and analyze your first resume to get AI-powered scores and improvement tips.</p>
                    <button className="btn btn-primary mt-4" onClick={goToAnalyzeTab}>
                      Analyze Your First Resume
                    </button>
                  </div>
                </div>
              )}
 
              {/* Resume List */}
              {resumes.map(r => {
                const expanded = expandedId === r.id;
                const analysis = r.analysis;
                const date = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
 
                return (
                  <div key={r.id} className="card bg-base-100 shadow-sm">
                    {/* Summary Row */}
                    <div
                      className="card-body flex-row items-center gap-4 cursor-pointer hover:bg-base-200/50 "
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                    >
                      <div className="w-11 h-11 bg-primary/10 rounded-lg grid place-items-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
 
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base-content truncate">{r.filename || 'Resume Analysis'}</p>
                        <p className="text-xs text-base-content/50">{date}</p>
                      </div>
 
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`badge badge-lg gap-1 font-bold ${scoreBadge(r.overall_score)}`}>
                          {r.overall_score}/100
                        </div>
 
                        {r.resume_path && (
                          <button
                            className="btn btn-ghost btn-sm btn-square"
                            title="Download"
                            onClick={e => { e.stopPropagation(); handleDownload(r.resume_path!, r.id); }}
                          >
                            {downloading === r.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />}
                          </button>
                        )}
 
                        {expanded ? <ChevronUp className="w-4 h-4 text-base-content/40" /> : <ChevronDown className="w-4 h-4 text-base-content/40" />}
                      </div>
                    </div>
 
                    {/* Expanded Detail */}
                    {expanded && analysis && (
                      <div className="px-6 pb-6 pt-0 space-y-5 border-t border-base-200">
                        {/* Summary */}
                        {analysis.summary && (
                          <p className="text-sm text-base-content/70 pt-4 italic">"{analysis.summary}"</p>
                        )}
 
                        {/* Score Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { label: 'ATS Compatibility', val: analysis.ats_compatibility },
                            { label: 'Content Quality', val: analysis.content_quality },
                            { label: 'Formatting', val: analysis.formatting },
                            { label: 'Keywords', val: analysis.keyword_optimization },
                            { label: 'Impact', val: analysis.impact_score },
                          ].filter(s => s.val != null).map(s => (
                            <div key={s.label} className="bg-base-200/50 rounded-lg p-3">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-base-content/70">{s.label}</span>
                                <span className="font-semibold">{s.val}%</span>
                              </div>
                              <progress className={`progress ${scoreProgress(s.val)} w-full`} value={s.val} max={100} />
                            </div>
                          ))}
                        </div>
 
                        {/* Strengths & Improvements */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {analysis.strengths?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> Strengths
                              </h4>
                              <ul className="space-y-1.5">
                                {analysis.strengths.map((s: any, i: number) => (
                                  <li key={i} className="text-sm text-base-content/70 flex gap-2">
                                    <span className="text-success mt-0.5">•</span>
                                    <span><strong>{s.title}</strong> — {s.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.improvements?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-warning mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" /> Improvements
                              </h4>
                              <ul className="space-y-1.5">
                                {analysis.improvements.map((imp: any, i: number) => (
                                  <li key={i} className="text-sm text-base-content/70 flex gap-2">
                                    <span className="text-warning mt-0.5">•</span>
                                    <span><strong>{imp.title}</strong> — {imp.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
 
                        {/* Keywords */}
                        {(analysis.keywords_present?.length > 0 || analysis.keywords_missing?.length > 0) && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-base-content/80">Keywords</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.keywords_present?.map((k: string, i: number) => (
                                <span key={`p${i}`} className="badge badge-sm badge-success badge-outline gap-1">
                                  <CheckCircle className="w-3 h-3" />{k}
                                </span>
                              ))}
                              {analysis.keywords_missing?.map((k: string, i: number) => (
                                <span key={`m${i}`} className="badge badge-sm badge-error badge-outline gap-1">
                                  <XCircle className="w-3 h-3" />{k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
 
                        {/* Action */}
                        <div className="flex justify-end pt-2">
                          <button className="btn btn-primary btn-sm gap-1.5" onClick={goToAnalyzeTab}>
                            <Eye className="w-4 h-4" /> Re-analyze
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
