import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, X, Download, Trash2 } from 'lucide-react';

const DOC_TYPES = ['NATIONAL_ID', 'KRA_PIN', 'PROPOSAL_FORM', 'POLICY_CERTIFICATE', 'CLAIM_FORM', 'OTHER'];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [filterClient, setFilterClient] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    const params = {};
    if (filterClient) params.clientId = filterClient;
    if (filterType) params.documentType = filterType;
    api.get('/documents', { params }).then(res => setDocuments(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filterClient, filterType]);
  useEffect(() => { api.get('/clients').then(res => setClients(res.data)).catch(() => {}); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !docType || !clientId) return alert('All fields required');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);
    formData.append('clientId', clientId);

    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setFile(null);
      setDocType('');
      setClientId('');
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    fetch();
  };

  const handleDownload = (id) => {
    window.open(`/api/documents/download/${id}`, '_blank');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
          <Plus size={16} /> Upload
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">File Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Uploaded By</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">No documents</td></tr>
            ) : documents.map(d => (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{d.fileName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{d.documentType.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{d.client?.fullName}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{d.uploadedBy?.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{new Date(d.uploadDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleDownload(d.id)} className="text-teal-600 hover:text-teal-800"><Download size={16} /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Upload Document</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <select required value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Select Client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
              <select required value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Document Type *</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <input type="file" required onChange={e => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <p className="text-xs text-slate-400">Max 5MB. PDF, images, or Word docs.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
