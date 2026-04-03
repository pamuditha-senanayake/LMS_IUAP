import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getResourceById, deleteResource, patchResourceStatus } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Building, Users, MapPin, ArrowLeft, Edit, Trash2, Calendar, Clock, Loader2, AlertTriangle } from 'lucide-react';

export default function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await getResourceById(id);
      setResource(response.data);
    } catch (err) {
      setError('Failed to load resource details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteResource(id);
        navigate('/');
      } catch (err) {
        alert('Failed to delete resource');
        setIsDeleting(false);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await patchResourceStatus(id, newStatus);
      setResource(response.data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (error || !resource) {
    return (
      <div className="bg-rose-50 text-rose-700 p-6 rounded-xl text-center border border-rose-200">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-80" />
        <h3 className="font-bold text-lg mb-1">{error || 'Resource not found'}</h3>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-white text-rose-700 font-medium rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Resource Details</h1>
        </div>
        <div className="flex space-x-3">
          <Link to={`/resources/${resource.id}/edit`} className="inline-flex items-center px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Link>
          <button onClick={handleDelete} disabled={isDeleting} className="inline-flex items-center px-4 py-2 bg-white text-rose-600 font-medium rounded-lg border border-slate-300 hover:bg-rose-50 transition-colors disabled:opacity-50">
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-200 bg-slate-50/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{resource.name}</h2>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{resource.type.replace(/_/g, ' ')} • {resource.resourceCode}</p>
            </div>
            <StatusBadge status={resource.status} />
          </div>
          
          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Quick Action: Change Status</label>
            <div className="flex space-x-2">
              <button onClick={() => handleStatusChange('ACTIVE')} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md border transition-colors ${resource.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Active</button>
              <button onClick={() => handleStatusChange('INACTIVE')} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md border transition-colors ${resource.status === 'INACTIVE' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Inactive</button>
              <button onClick={() => handleStatusChange('OUT_OF_SERVICE')} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md border transition-colors ${resource.status === 'OUT_OF_SERVICE' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Out of Service</button>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <Building className="w-4 h-4 mr-2 text-indigo-500" /> Location Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Building & Floor</p>
                <p className="text-sm text-slate-800 font-medium">{resource.building || 'N/A'} {resource.floor ? `- Floor ${resource.floor}` : ''}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Exact Location</p>
                <p className="text-sm text-slate-800 font-medium break-words">{resource.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <Users className="w-4 h-4 mr-2 text-indigo-500" /> Specifications
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capacity</p>
                <p className="text-sm text-slate-800 font-medium">{resource.capacity} People</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> General Description
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {resource.description || 'No description provided for this resource.'}
            </p>
          </div>

          <div className="md:col-span-2 mt-4 flex items-center text-xs font-medium text-slate-400 justify-between border-t border-slate-100 pt-6">
            <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Created: {new Date(resource.createdAt).toLocaleString()}</div>
            <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Last Updated: {new Date(resource.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
