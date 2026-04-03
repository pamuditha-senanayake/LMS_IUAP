import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Building, Users, MapPin, Eye } from 'lucide-react';

export default function ResourceCard({ resource }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex justify-between items-start flex-1 w-full">
        <div className="truncate pr-2 w-full">
          <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight truncate">{resource.name}</h3>
          <p className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">{resource.type.replace(/_/g, ' ')} • {resource.resourceCode}</p>
        </div>
        <StatusBadge status={resource.status} />
      </div>
      <div className="p-5 bg-slate-50/50 space-y-3 flex-none">
        <div className="flex items-center text-sm text-slate-600">
          <Users className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800">{resource.capacity}</span> <span className="ml-1">Capacity</span>
        </div>
        <div className="flex items-center text-sm text-slate-600 truncate">
          <Building className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
          <span className="truncate">{resource.building || 'N/A'} {resource.floor ? `(Fl ${resource.floor})` : ''}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600 truncate">
          <MapPin className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
          <span className="truncate">{resource.location || 'N/A'}</span>
        </div>
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex-none">
        <Link 
          to={`/resources/${resource.id}`}
          className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Link>
      </div>
    </div>
  );
}
