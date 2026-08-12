
import React, { useState } from 'react';
import { LibraryResource, User, UserRole } from '../types';
import { FileText, Upload, Download, Trash2, Search, Book, Plus, X, File } from 'lucide-react';
import { PageHeader, Card, Button, Field, Input, StatusBadge, EmptyState } from './ui';

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
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.library}
        subtitle={`${filteredResources.length} / ${resources.length}`}
        actions={(user.role === UserRole.TEACHER || user.role === UserRole.DIRECTOR) && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> {t.add_resource || 'Fayl yuklash'}
          </Button>
        )}
      />

      <Card className="mb-5">
        <Field label={t.search_label || 'Qidirish'}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <Input
              className="pl-9"
              placeholder={t.search_placeholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </Field>
      </Card>

      {filteredResources.length === 0 ? (
        <Card>
          <EmptyState icon={<Book size={22} />} title={t.search_empty} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <Card key={resource.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="p-2 bg-primary-subtle text-primary rounded-md shrink-0">
                  {resource.fileType.includes('pdf') ? <FileText size={20} /> : <File size={20} />}
                </div>
                <StatusBadge label={resource.category} tone="brand" dot={false} />
              </div>

              <h3 className="text-[15px] font-semibold text-ink truncate">{resource.title}</h3>
              <p className="text-[13px] text-ink-2 line-clamp-2 mt-1 flex-1">{resource.description}</p>

              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-line">
                <span className="text-[12px] text-muted">
                  {new Date(resource.uploadedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  {user.role === UserRole.DIRECTOR && (
                    <button
                      onClick={() => onDelete(resource.id)}
                      title={t.delete_action || "O'chirish"}
                      className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <a
                    href={resource.fileData}
                    download={resource.title}
                    className="inline-flex items-center gap-1.5 rounded-field font-semibold text-[12.5px] px-2.5 py-1.5 bg-primary text-white hover:bg-primary-hover transition-colors"
                  >
                    <Download size={14} /> {t.download}
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}


      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
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
