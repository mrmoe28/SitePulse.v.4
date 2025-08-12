'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Download, Trash2, Search, Filter, FolderPlus, FolderOpen, Eye, PenTool, Send, LayoutGrid, LayoutList, ArrowLeft, AlertCircle, Copy, Mail, MessageCircle, CheckCircle, Receipt, ClipboardList, Ruler, HardHat, Zap } from 'lucide-react';
import { useToast } from '@/components/Toast';
import DocumentViewer from '@/components/DocumentViewer';

// Dynamic import to avoid SSR issues
const DocumentSigner = dynamic(() => import('@/components/DocumentSigner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="text-white">Loading document signer...</div>
    </div>
  )
});

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  file?: File; // Store the actual File object for local files
  uploadDate: Date;
  category?: string;
  status?: 'draft' | 'pending_signature' | 'signed' | 'completed';
}

// Document categories
const DOCUMENT_CATEGORIES = {
  contracts: { id: 'contracts', name: 'Contracts', icon: FileText },
  invoices: { id: 'invoices', name: 'Invoices', icon: Receipt },
  permits: { id: 'permits', name: 'Permits', icon: ClipboardList },
  blueprints: { id: 'blueprints', name: 'Blueprints', icon: Ruler },
  safety: { id: 'safety', name: 'Safety Docs', icon: HardHat },
  powerbills: { id: 'powerbills', name: 'Power Bills', icon: Zap },
} as const;

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryColor(categoryId?: string): string {
  const colors = {
    contracts: 'border-blue-500 text-blue-600 dark:text-blue-400',
    invoices: 'border-green-500 text-green-600 dark:text-green-400',
    permits: 'border-purple-500 text-purple-600 dark:text-purple-400',
    blueprints: 'border-cyan-500 text-cyan-600 dark:text-cyan-400',
    safety: 'border-red-500 text-red-600 dark:text-red-400',
    powerbills: 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
  };
  return colors[categoryId as keyof typeof colors] || 'border-gray-500 text-gray-600 dark:text-gray-400';
}

export default function DocumentsPage() {
  const { addToast, ToastContainer } = useToast();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [signingDocument, setSigningDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [changingCategoryDoc, setChangingCategoryDoc] = useState<Document | null>(null);
  const [newCategory, setNewCategory] = useState<string>('');
  const [sendingForSignature, setSendingForSignature] = useState<Document | null>(null);
  const [signatureFormData, setSignatureFormData] = useState({
    signerName: '',
    signerEmail: '',
    message: '',
  });
  const [signingRecipient, setSigningRecipient] = useState<{ name: string; email: string } | null>(null);
  const [shareMethod, setShareMethod] = useState<'email' | 'link' | 'whatsapp'>('email');
  const [signatureLink, setSignatureLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents/upload');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files.length > 0) {
      setIsUploading(true);
      let successCount = 0;
      
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          // Validate file type
          const validTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
          
          if (!validTypes.includes(fileExtension)) {
            addToast(`Invalid file type: ${file.name}`, 'error');
            return null;
          }
          
          // Validate file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            addToast(`File too large: ${file.name} (max 10MB)`, 'error');
            return null;
          }
          
          console.log('Uploading file:', file.name, file.size);
          
          // Upload file to API
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', 'contracts');
          
          try {
            const response = await fetch('/api/documents/upload', {
              method: 'POST',
              body: formData
            });
            
            console.log('Upload response status:', response.status);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.error('Non-JSON response:', await response.text());
              throw new Error('Server returned non-JSON response');
            }
            
            const data = await response.json();
            console.log('Upload response data:', data);
            
            if (response.ok && data.success) {
              successCount++;
              return data.document;
            } else {
              throw new Error(data.error || 'Upload failed');
            }
          } catch (error) {
            console.error('Upload error:', error);
            addToast(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            return null;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        const newDocuments = results.filter(doc => doc !== null);
        
        if (newDocuments.length > 0) {
          setDocuments(prev => [...newDocuments, ...prev]);
          addToast(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`, 'success');
          setShowUpload(false);
        }
      } catch (error) {
        console.error('File selection error:', error);
        addToast('An error occurred during upload', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  const handleDelete = (doc: Document) => {
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    addToast(`Deleted ${doc.name}`, 'success');
  };

  const handleCategoryChange = async () => {
    if (!changingCategoryDoc || !newCategory) return;
    
    // Update the document's category
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === changingCategoryDoc.id 
          ? { ...doc, category: newCategory }
          : doc
      )
    );
    
    addToast(`Changed category to ${DOCUMENT_CATEGORIES[newCategory as keyof typeof DOCUMENT_CATEGORIES]?.name || 'Other'}`, 'success');
    setChangingCategoryDoc(null);
    setNewCategory('');
  };

  const handleSendForSignature = async () => {
    if (!sendingForSignature || !signatureFormData.signerName) {
      addToast('Please enter the signer\'s name', 'error');
      return;
    }

    if (shareMethod === 'email' && !signatureFormData.signerEmail) {
      addToast('Please enter the signer\'s email', 'error');
      return;
    }

    try {
      const response = await fetch('/api/signature-request/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: sendingForSignature.id,
          documentName: sendingForSignature.name,
          documentUrl: sendingForSignature.url,
          signerEmail: signatureFormData.signerEmail || 'noemail@placeholder.com',
          signerName: signatureFormData.signerName,
          message: signatureFormData.message,
          requestedBy: 'PulseCRM User', // In production, get from session
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSignatureLink(data.signatureUrl);
        
        if (shareMethod === 'email' && data.emailSent) {
          addToast(`Signature request sent to ${signatureFormData.signerEmail}`, 'success');
          setSendingForSignature(null);
          setSignatureFormData({ signerName: '', signerEmail: '', message: '' });
          setSignatureLink('');
        } else if (shareMethod === 'link') {
          // Copy link to clipboard
          navigator.clipboard.writeText(data.signatureUrl);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 3000);
          addToast('Signature link copied to clipboard!', 'success');
        } else if (shareMethod === 'whatsapp') {
          // Open WhatsApp with pre-filled message
          const message = `Hello ${signatureFormData.signerName},\n\nPlease sign this document: ${sendingForSignature.name}\n\n${signatureFormData.message ? signatureFormData.message + '\n\n' : ''}Click here to sign: ${data.signatureUrl}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          addToast('Opening WhatsApp...', 'info');
        }
        
        // Update document status
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === sendingForSignature.id
              ? { ...doc, status: 'pending_signature' as const }
              : doc
          )
        );
      } else {
        addToast(data.error || 'Failed to create signature request', 'error');
      }
    } catch (error) {
      console.error('Error sending signature request:', error);
      addToast('Failed to create signature request', 'error');
    }
  };

  const copySignatureLink = () => {
    if (signatureLink) {
      navigator.clipboard.writeText(signatureLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
      addToast('Link copied to clipboard!', 'success');
    }
  };

  const getFileIcon = (doc: Document) => {
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getStatusBadge = (status?: Document['status']) => {
    const badges = {
      draft: 'bg-gray-600 text-gray-200',
      pending_signature: 'bg-yellow-600 text-yellow-200',
      signed: 'bg-green-600 text-green-200',
      completed: 'bg-blue-600 text-blue-200'
    };

    const labels = {
      draft: 'Draft',
      pending_signature: 'Pending Signature',
      signed: 'Signed',
      completed: 'Completed'
    };

    if (!status) return null;

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get all categories for filter
  const allCategories = [
    { id: 'all', name: 'All Documents' },
    ...Object.values(DOCUMENT_CATEGORIES).map(cat => ({
      id: cat.id,
      name: cat.name
    }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <FileText className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Document Management</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload New Document</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative ${
                isDragging 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Uploading files...</p>
                </div>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-orange-500' : 'text-gray-400 dark:text-gray-400'}`} />
                  <p className={`mb-2 ${isDragging ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'}`}>
                    {isDragging ? 'Drop files here...' : 'Drag and drop files here or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Supported formats: PDF, DOC, DOCX, XLS, XLSX</p>
                </>
              )}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={async (e) => {
                  if (e.target.files) {
                    await handleFileSelect(e.target.files);
                  }
                  // Reset the input
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
            >
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Categories Overview */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Object.values(DOCUMENT_CATEGORIES).map(category => {
            const count = documents.filter(doc => doc.category === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`p-4 rounded-lg border transition-colors ${
                  filterCategory === category.id
                    ? 'bg-orange-50 dark:bg-gray-700 border-orange-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-2 flex justify-center">
                  <category.icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{count} documents</div>
              </button>
            );
          })}
        </div>

        {/* Document List */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map((doc) => {
                  const category = Object.values(DOCUMENT_CATEGORIES).find(cat => cat.id === doc.category);
                  
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(doc)}
                          <button
                            onClick={() => setViewingDocument(doc)}
                            className="ml-3 text-gray-900 dark:text-white hover:text-orange-500 text-left transition-colors"
                          >
                            {doc.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(doc.category)}`}>
                          {category?.name || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingDocument(doc)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {doc.type === 'application/pdf' && doc.status !== 'signed' && doc.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => {
                                  setSigningDocument(doc);
                                  // If document has pending signature status, we might have recipient info
                                  // For now, we'll set demo recipient info for demonstration
                                  if (doc.status === 'pending_signature') {
                                    setSigningRecipient({ name: 'John Doe', email: 'john.doe@example.com' });
                                  } else {
                                    setSigningRecipient(null);
                                  }
                                }}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Sign Document"
                              >
                                <PenTool className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSendingForSignature(doc);
                                  // Reset form when opening modal
                                  setSignatureFormData({ signerName: '', signerEmail: '', message: '' });
                                }}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Send for Signature"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setChangingCategoryDoc(doc);
                              setNewCategory(doc.category || '');
                            }}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Change Category"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <a
                            href={doc.url}
                            download
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredDocuments.map((doc) => {
              const category = Object.values(DOCUMENT_CATEGORIES).find(cat => cat.id === doc.category);
              
              return (
                <div 
                  key={doc.id} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc)}
                      <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(doc.category)}`}>
                        {category?.name || 'Other'}
                      </span>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  
                  <button
                    onClick={() => setViewingDocument(doc)}
                    className="text-left w-full mb-3"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white hover:text-orange-500 transition-colors truncate">
                      {doc.name}
                    </h3>
                  </button>
                  
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(doc.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uploaded:</span>
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 mx-auto" />
                    </button>
                    {doc.type === 'application/pdf' && doc.status !== 'signed' && doc.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => {
                            setSigningDocument(doc);
                            // If document has pending signature status, we might have recipient info
                            // For now, we'll set demo recipient info for demonstration
                            if (doc.status === 'pending_signature') {
                              setSigningRecipient({ name: 'John Doe', email: 'john.doe@example.com' });
                            } else {
                              setSigningRecipient(null);
                            }
                          }}
                          className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Sign"
                        >
                          <PenTool className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => {
                            setSendingForSignature(doc);
                            // Reset form when opening modal
                            setSignatureFormData({ signerName: '', signerEmail: '', message: '' });
                          }}
                          className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Send"
                        >
                          <Send className="w-4 h-4 mx-auto" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setChangingCategoryDoc(doc);
                        setNewCategory(doc.category || '');
                      }}
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Category"
                    >
                      <FolderOpen className="w-4 h-4 mx-auto" />
                    </button>
                    <a
                      href={doc.url}
                      download
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterCategory !== 'all' 
                  ? 'No documents found matching your criteria' 
                  : 'No documents uploaded yet'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onSendForSignature={() => {
            setSendingForSignature(viewingDocument);
            setViewingDocument(null);
            setSignatureFormData({ signerName: '', signerEmail: '', message: '' });
          }}
        />
      )}
      
      {/* Document Signer */}
      {signingDocument && (
        <DocumentSigner
          document={signingDocument}
          recipientName={signingRecipient?.name}
          recipientEmail={signingRecipient?.email}
          onClose={() => {
            setSigningDocument(null);
            setSigningRecipient(null);
          }}
          onSign={(docId, signatures) => {
            // Update document status
            setDocuments(prev => prev.map(doc => 
              doc.id === docId 
                ? { ...doc, status: 'signed' as const }
                : doc
            ));
            addToast('Document signed successfully!', 'success');
            setSigningRecipient(null);
          }}
        />
      )}

      {/* Category Change Modal */}
      {changingCategoryDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Change Document Category
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select a new category for "{changingCategoryDoc.name}"
            </p>
            
            <div className="space-y-2 mb-6">
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                <label
                  key={key}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    newCategory === key 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={newCategory === key}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="sr-only"
                  />
                  <category.icon className="w-6 h-6 mr-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setChangingCategoryDoc(null);
                  setNewCategory('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryChange}
                disabled={!newCategory || newCategory === changingCategoryDoc.category}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Change Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send for Signature Modal */}
      {sendingForSignature && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Send Document for Signature
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Send "{sendingForSignature.name}" to be electronically signed
            </p>
            
            {/* Share Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How would you like to share?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setShareMethod('email')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    shareMethod === 'email'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                
                <button
                  onClick={() => setShareMethod('link')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    shareMethod === 'link'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Copy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Copy Link</span>
                </button>
                
                <button
                  onClick={() => setShareMethod('whatsapp')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    shareMethod === 'whatsapp'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Signer's Name *
                </label>
                <input
                  type="text"
                  value={signatureFormData.signerName}
                  onChange={(e) => setSignatureFormData({ ...signatureFormData, signerName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {shareMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signer's Email *
                  </label>
                  <input
                    type="email"
                    value={signatureFormData.signerEmail}
                    onChange={(e) => setSignatureFormData({ ...signatureFormData, signerEmail: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={signatureFormData.message}
                  onChange={(e) => setSignatureFormData({ ...signatureFormData, message: e.target.value })}
                  placeholder="Please review and sign this document at your earliest convenience."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            
            {/* Generated Link Display */}
            {signatureLink && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                      Signature link created!
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs text-gray-600 dark:text-gray-400 break-all mb-2">
                      {signatureLink}
                    </div>
                    <button
                      onClick={copySignatureLink}
                      className="text-sm text-green-700 dark:text-green-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {linkCopied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>
                  {shareMethod === 'email' && (
                    <>
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email: 
                    </>
                  )}
                  {shareMethod === 'link' && (
                    <>
                      <Copy className="inline w-4 h-4 mr-1" />
                      Link: 
                    </>
                  )}
                  {shareMethod === 'whatsapp' && (
                    <>
                      <MessageCircle className="inline w-4 h-4 mr-1" />
                      WhatsApp: 
                    </>
                  )}
                </strong>
                {shareMethod === 'email' && 'The signer will receive an email with a secure link'}
                {shareMethod === 'link' && 'Copy the link and share it via any platform'}
                {shareMethod === 'whatsapp' && 'Share the signature link via WhatsApp'}
                <br />• The signature request expires in 7 days
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSendingForSignature(null);
                  setSignatureFormData({ signerName: '', signerEmail: '', message: '' });
                  setSignatureLink('');
                  setShareMethod('email');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendForSignature}
                disabled={!signatureFormData.signerName || (shareMethod === 'email' && !signatureFormData.signerEmail)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {shareMethod === 'email' && 'Send Email'}
                {shareMethod === 'link' && 'Generate Link'}
                {shareMethod === 'whatsapp' && 'Share on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
}