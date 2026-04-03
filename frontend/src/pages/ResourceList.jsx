import React, { useState, useEffect } from 'react';
import { getResources } from '../services/api';
import ResourceCard from '../components/ResourceCard';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    minCapacity: '',
    status: ''
  });

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Clean up empty filters
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const response = await getResources(params);
      setResources(response.data);
    } catch (error) {
      console.error("Error fetching resources", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-indigo-500" />
            Filter Resources
          </h2>
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
            {resources.length} Results
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border bg-white text-slate-700">
              <option value="">All Types</option>
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Lab</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="PROJECTOR">Projector</option>
              <option value="CAMERA">Camera</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border bg-white text-slate-700">
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Min Capacity</label>
            <input type="number" name="minCapacity" value={filters.minCapacity} onChange={handleFilterChange} placeholder="e.g. 30" className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border bg-white text-slate-700 placeholder-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Location</label>
            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Search by location..." className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border bg-white text-slate-700 placeholder-slate-400" />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-xl shadow-sm border border-slate-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No resources found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for across the campus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
