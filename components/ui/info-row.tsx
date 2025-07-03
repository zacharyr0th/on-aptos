import React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex gap-4 items-start">
    <span className="text-sm text-muted-foreground w-[120px] flex-shrink-0">
      {label}
    </span>
    <div className="flex-1">{value}</div>
  </div>
);
