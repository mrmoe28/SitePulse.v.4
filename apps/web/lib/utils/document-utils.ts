import { FileText, Receipt, ClipboardList, Ruler, HardHat, Shield, FileText as ProposalIcon, FolderOpen } from 'lucide-react';

// Document categories
export const DOCUMENT_CATEGORIES = {
  contracts: { id: 'contracts', name: 'Contracts', icon: FileText },
  invoices: { id: 'invoices', name: 'Invoices', icon: Receipt },
  permits: { id: 'permits', name: 'Permits', icon: ClipboardList },
  blueprints: { id: 'blueprints', name: 'Blueprints', icon: Ruler },
  safety: { id: 'safety', name: 'Safety Docs', icon: HardHat },
  insurance: { id: 'insurance', name: 'Insurance', icon: Shield },
  proposals: { id: 'proposals', name: 'Proposals', icon: ProposalIcon },
  other: { id: 'other', name: 'Other', icon: FolderOpen }
} as const;

// Contract templates
export const CONTRACT_TEMPLATES = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    description: 'Standard service contract template',
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text' },
      { name: 'projectAddress', label: 'Project Address', type: 'text' },
      { name: 'scopeOfWork', label: 'Scope of Work', type: 'textarea' },
      { name: 'totalAmount', label: 'Total Amount', type: 'number' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'completionDate', label: 'Completion Date', type: 'date' }
    ]
  },
  {
    id: 'change-order',
    name: 'Change Order',
    description: 'Change order request form',
    fields: [
      { name: 'projectName', label: 'Project Name', type: 'text' },
      { name: 'changeDescription', label: 'Change Description', type: 'textarea' },
      { name: 'additionalCost', label: 'Additional Cost', type: 'number' },
      { name: 'timeImpact', label: 'Time Impact (days)', type: 'number' }
    ]
  },
  {
    id: 'subcontractor',
    name: 'Subcontractor Agreement',
    description: 'Agreement for subcontractors',
    fields: [
      { name: 'subcontractorName', label: 'Subcontractor Name', type: 'text' },
      { name: 'trade', label: 'Trade/Specialty', type: 'text' },
      { name: 'workDescription', label: 'Work Description', type: 'textarea' },
      { name: 'paymentAmount', label: 'Payment Amount', type: 'number' },
      { name: 'insuranceRequired', label: 'Insurance Required', type: 'checkbox' }
    ]
  }
];

// Helper functions
export function getCategoryColor(categoryId?: string): string {
  const colors = {
    contracts: 'border-blue-500 text-blue-400',
    invoices: 'border-green-500 text-green-400',
    permits: 'border-purple-500 text-purple-400',
    blueprints: 'border-cyan-500 text-cyan-400',
    safety: 'border-red-500 text-red-400',
    insurance: 'border-yellow-500 text-yellow-400',
    proposals: 'border-pink-500 text-pink-400',
    other: 'border-gray-500 text-gray-400'
  };
  return colors[categoryId as keyof typeof colors] || colors.other;
}

export function getCategoryIcon(categoryId: string) {
  return DOCUMENT_CATEGORIES[categoryId as keyof typeof DOCUMENT_CATEGORIES]?.icon || FolderOpen;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}