import React from 'react';

interface VehicleTypeCardProps {
  type: string;
  count: number;
  vehicleImages: { [key: string]: string };
}

export const VehicleTypeCard: React.FC<VehicleTypeCardProps> = ({ type, count, vehicleImages }) => (
  <div className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded group">
    <div className="bg-gray-100 rounded-lg p-3 mb-2 h-14 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
      {vehicleImages[type] ? (
        <img 
          src={vehicleImages[type]} 
          alt={`${type} vehicle type`}
          className="max-w-full max-h-full object-contain"
          style={{ width: 'auto', height: '35px' }}
        />
      ) : (
        <div className="text-gray-400 text-xs">{type}</div>
      )}
    </div>
    <div className="carzino-vehicle-type-name">{type}</div>
    <div className="carzino-vehicle-type-count">({count})</div>
  </div>
);
