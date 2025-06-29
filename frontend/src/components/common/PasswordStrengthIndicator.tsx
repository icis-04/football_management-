import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const calculateStrength = (pwd: string): { score: number; message: string; color: string } => {
    let score = 0;
    
    if (!pwd) return { score: 0, message: '', color: '' };
    
    // Length check
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    // Determine strength level
    if (score <= 2) {
      return { score: 1, message: 'Weak', color: 'bg-red-500' };
    } else if (score <= 4) {
      return { score: 2, message: 'Fair', color: 'bg-yellow-500' };
    } else if (score <= 5) {
      return { score: 3, message: 'Good', color: 'bg-blue-500' };
    } else {
      return { score: 4, message: 'Strong', color: 'bg-green-500' };
    }
  };

  const strength = calculateStrength(password);
  
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password strength:</span>
        <span className={`text-xs font-medium ${
          strength.color === 'bg-red-500' ? 'text-red-600' :
          strength.color === 'bg-yellow-500' ? 'text-yellow-600' :
          strength.color === 'bg-blue-500' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strength.message}
        </span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {password.length < 8 && <div>• At least 8 characters</div>}
        {!/[A-Z]/.test(password) && <div>• Include uppercase letters</div>}
        {!/[a-z]/.test(password) && <div>• Include lowercase letters</div>}
        {!/[0-9]/.test(password) && <div>• Include numbers</div>}
        {!/[^A-Za-z0-9]/.test(password) && <div>• Include special characters</div>}
      </div>
    </div>
  );
}; 