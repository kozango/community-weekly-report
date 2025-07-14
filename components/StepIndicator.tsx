
import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.Upload, name: '1. ファイルアップロード' },
  { id: AppStep.Configure, name: '2. 期間選択' },
  { id: AppStep.Generate, name: '3. 週報生成' },
];

const Step: React.FC<{ name: string; isCurrent: boolean; isCompleted: boolean }> = ({ name, isCurrent, isCompleted }) => {
  const baseClasses = 'flex items-center justify-center w-10 h-10 rounded-full text-lg font-semibold';
  const textBaseClasses = 'mt-2 text-sm text-center';
  
  let circleClasses = 'bg-gray-300 text-gray-500';
  let textClasses = 'text-gray-500';

  if (isCurrent) {
    circleClasses = 'bg-brand-primary text-white scale-110 shadow-lg';
    textClasses = 'text-brand-primary font-bold';
  } else if (isCompleted) {
    circleClasses = 'bg-green-500 text-white';
    textClasses = 'text-gray-700';
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`${baseClasses} ${circleClasses} transition-all duration-300`}>
        {isCompleted && !isCurrent ? '✓' : name.charAt(0)}
      </div>
      <p className={`${textBaseClasses} ${textClasses} transition-colors duration-300`}>{name}</p>
    </div>
  );
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <nav className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <Step
              name={step.name}
              isCurrent={currentStep === step.id}
              isCompleted={currentStep > step.id}
            />
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 rounded-full mx-4 mt-5 ${currentStep > step.id + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};
