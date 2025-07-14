
import React from 'react';
import { Icon } from './Icon';

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h18v-3.75M3.75 12.75c0-3.995 3.255-7.245 7.245-7.245 3.99 0 7.245 3.25 7.245 7.245" />
    </svg>
  </Icon>
);
