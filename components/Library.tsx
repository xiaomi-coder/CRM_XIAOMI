
import React, { useState } from 'react';
import { LibraryResource, User, UserRole } from '../types';
import { FileText, Upload, Download, Trash2, Search, Book, Plus, X, File } from 'lucide-react';

interface LibraryProps {
  resources: LibraryResource[];
  user: User;
  onAdd: (resource: Omit<LibraryResource, 'id' | 'centerId' | 'uploadedBy' | 'uploadedAt'>) => void;
  onDelete: (id: string) => void;
}

interface LibraryProps {
  t: any;
  resources: LibraryResource[];
  user: User;
  onAdd: (resource: Omit<LibraryResource, 'id' | 'centerId' | 'uploadedBy' | 'uploadedAt'>) => void;
  onDelete: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({ t, resources, user, onAdd, onDelete }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: t.subj_english,
    fileData: '',
    fileType: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          fileData: reader.result as string,
          fileType: file.type || 'application/pdf'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileData) return alert(t.add_resource || 'Upload file!');
    onAdd(formData);
    setShowUploadModal(false);
    setFormData({ title: '', description: '', category: t.subj_english, fileData: '', fileType: '' });
  };

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t.search_placeholder || "Search..."}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {user.role !== UserRole.TEACHER && user.role !== UserRole.DIRECTOR ? null : (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Upload size={20} />
            <span>{t.add_resource || 'Upload file'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                {resource.fileType.includes('pdf') ? <FileText size={24} /> : <File size={24} />}
              </div>
              <span className="text-[10px] font-bold uppercase text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg">
                {resource.category}
              </span>
            </div>

            <h4 className="font-bold text-gray-800 text-lg mb-1 truncate">{resource.title}</h4>
            <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{resource.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-[10px] text-gray-400 font-medium italic">
                {new Date(resource.uploadedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                {user.role === UserRole.DIRECTOR && (
                  <button
                    onClick={() => onDelete(resource.id)}
                    className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <a
                  href={resource.fileData}
                  download={resource.title}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Download size={16} />
                  {t.download}
                </a>
              </div>
            </div>
          </div>
        ))}
        {filteredResources.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4">
              <Book size={48} className="mx-auto opacity-20" />
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.search_empty || 'No resources found'}</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-pop p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t.add_resource || 'Upload Resource'}</h3>
              <button onClick={() => setShowUploadModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.title}</label>
                <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.category}</label>
                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value={t.subj_english}>{t.subj_english}</option>
                  <option value={t.subj_math}>{t.subj_math}</option>
                  <option value={t.subj_native}>{t.subj_native}</option>
                  <option value={t.subj_other}>{t.subj_other}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.note}</label>
                <textarea className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description..."></textarea>
              </div>
              <div className="border-2 border-dashed border-indigo-100 rounded-2xl p-6 text-center hover:border-indigo-300 transition-all relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="text-indigo-600">
                  <Upload size={32} className="mx-auto mb-2" />
                  <p className="text-sm font-bold">{formData.fileData ? 'OK ✅' : (t.uz === "Kutubxona" ? "Faylni tanlang" : "Select file")}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-gray-500 font-bold">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
