import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, X, Sparkles, FileCheck, Loader2 } from 'lucide-react';

export function UploadResume() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsProcessed(false);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock extracted data
    const mockData = {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      skills: [
        'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 
        'Machine Learning', 'Data Analysis', 'SQL', 'Git', 'Agile'
      ],
      experience: [
        {
          title: 'Senior Frontend Developer',
          company: 'Tech Corp',
          duration: '2020 - Present',
          description: 'Led development of web applications using React and TypeScript'
        },
        {
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          duration: '2018 - 2020',
          description: 'Developed and maintained full-stack applications'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of Technology',
          year: '2018'
        }
      ],
      summary: 'Experienced software developer with 5+ years of expertise in web development, specializing in React and modern JavaScript frameworks.'
    };
    
    setExtractedData(mockData);
    setIsProcessing(false);
    setIsProcessed(true);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    setIsProcessed(false);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-base-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-linear-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl text-base-content">Upload Resume</h2>
        </div>
        <p className="text-base-content/70">
          Upload your resume and let our AI extract your skills, experience, and qualifications automatically.
        </p>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div className="bg-base-100 rounded-xl shadow-sm p-8">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-base-300 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={handleBrowse}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl text-base-content mb-2">Drop your resume here</h3>
              <p className="text-base-content/70 mb-4">or click to browse</p>
              <button
                type="button"
                className="bg-linear-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Choose File
              </button>
              <p className="text-sm text-base-content/60 mt-4">
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

      {/* Uploaded File */}
      {uploadedFile && (
        <div className="bg-base-100 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-base-content">Uploaded Resume</h3>
            {!isProcessing && (
              <button
                onClick={handleRemoveFile}
                className="text-base-content/50 hover:text-error transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base-content truncate">{uploadedFile.name}</p>
              <p className="text-sm text-base-content/60">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
            {isProcessed && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Processed</span>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-base-content/80">AI is analyzing your resume...</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div className="bg-linear-to-r from-primary to-secondary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Data */}
      {isProcessed && extractedData && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-success/10 border border-success/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-success" />
              <div>
                <h4 className="text-success">Resume Processed Successfully!</h4>
                <p className="text-sm text-success">
                  We've extracted your information. Review and confirm the details below.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-base-content/70 mb-1">Full Name</label>
                <input
                  type="text"
                  value={extractedData.name}
                  readOnly
                  className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-200"
                />
              </div>
              <div>
                <label className="block text-sm text-base-content/70 mb-1">Email</label>
                <input
                  type="email"
                  value={extractedData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-base-content/70 mb-1">Phone</label>
                <input
                  type="tel"
                  value={extractedData.phone}
                  readOnly
                  className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-200"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-4">Professional Summary</h3>
            <p className="text-base-content/80 leading-relaxed">{extractedData.summary}</p>
          </div>

          {/* Skills */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-4">Extracted Skills</h3>
            <div className="flex flex-wrap gap-2">
              {extractedData.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-linear-to-r from-primary/20 to-secondary/20 text-primary rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-4">Work Experience</h3>
            <div className="space-y-4">
              {extractedData.experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h4 className="text-base-content">{exp.title}</h4>
                  <p className="text-sm text-base-content/70">{exp.company} • {exp.duration}</p>
                  <p className="text-sm text-base-content/80 mt-2">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg text-base-content mb-4">Education</h3>
            <div className="space-y-3">
              {extractedData.education.map((edu: any, index: number) => (
                <div key={index} className="border-l-4 border-secondary pl-4">
                  <h4 className="text-base-content">{edu.degree}</h4>
                  <p className="text-sm text-base-content/70">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 bg-linear-to-r from-primary to-secondary text-white py-3 rounded-lg hover:shadow-lg transition-all">
              Save to Profile
            </button>
            <button
              onClick={handleRemoveFile}
              className="px-6 py-3 border-2 border-base-300 text-base-content/80 rounded-lg hover:bg-base-200 transition-colors"
            >
              Upload New Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
