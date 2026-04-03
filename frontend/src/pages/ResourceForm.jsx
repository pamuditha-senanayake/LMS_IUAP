import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getResourceById, createResource, updateResource } from '../services/api';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

export default function ResourceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    resourceCode: '',
    type: 'LECTURE_HALL',
    capacity: 1,
    location: '',
    building: '',
    floor: '',
    status: 'ACTIVE',
    description: ''
  });
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchResource();
    }
  }, [id]);

  const fetchResource = async () => {
    try {
      const response = await getResourceById(id);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load resource details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const dataToSubmit = {
        ...formData,
        capacity: parseInt(formData.capacity, 10)
      };
      
      if (isEdit) {
        await updateResource(id, dataToSubmit);
      } else {
        await createResource(dataToSubmit);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save resource';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Resource' : 'Add New Resource'}</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Resource Name *</label>
              <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" placeholder="e.g. Main Auditorium" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Resource Code *</label>
              <input required type="text" name="resourceCode" value={formData.resourceCode || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" placeholder="e.g. AUD-01" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type *</label>
              <select required name="type" value={formData.type || 'LECTURE_HALL'} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="PROJECTOR">Projector</option>
                <option value="CAMERA">Camera</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capacity</label>
              <input type="number" min="1" name="capacity" value={formData.capacity || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status *</label>
              <select required name="status" value={formData.status || 'ACTIVE'} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location / Address</label>
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Building</label>
              <input type="text" name="building" value={formData.building || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Floor</label>
              <input type="text" name="floor" value={formData.floor || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea name="description" rows="4" value={formData.description || ''} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"></textarea>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? 'Save Changes' : 'Create Resource'}
          </button>
        </div>
      </form>
    </div>
  );
}
