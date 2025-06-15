import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { useAuthStore } from '../stores/authStore';
import { UserCircleIcon, CameraIcon, CheckIcon } from '@heroicons/react/24/outline';

import type { Position } from '../types';

interface ProfileFormData {
  name: string;
  preferredPosition: Position;
}

const POSITIONS = [
  { value: 'goalkeeper', label: 'Goalkeeper', emoji: '🥅' },
  { value: 'defender', label: 'Defender', emoji: '🛡️' },
  { value: 'midfielder', label: 'Midfielder', emoji: '⚡' },
  { value: 'forward', label: 'Forward', emoji: '⚽' },
  { value: 'any', label: 'Any Position', emoji: '🎯' },
];

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    preferredPosition: user?.preferredPosition || 'any',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if redirected from ProfileCompletionCheck
    if (location.state?.message) {
      setIsEditing(true);
      setSuccessMessage(''); // Clear any existing success message
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePositionChange = (position: string) => {
    setFormData(prev => ({ ...prev, preferredPosition: position as Position }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      updateUser({
        ...user!,
        name: formData.name,
        preferredPosition: formData.preferredPosition,
      });
      
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Please upload a JPEG or PNG image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      // TODO: Replace with actual API call
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update local state
      updateUser({
        ...user!,
        profilePicUrl: previewUrl,
      });
      
      setSuccessMessage('Profile picture updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      // TODO: Replace with actual API call
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      updateUser({
        ...user!,
        profilePicUrl: undefined,
      });
      
      setSuccessMessage('Profile picture removed!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 3; // email, name, position
    
    if (user?.email) completed++;
    if (user?.name) completed++;
    if (user?.preferredPosition && user.preferredPosition !== 'any') completed++;
    
    return Math.round((completed / total) * 100);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile information and preferences
        </p>
      </div>

      {/* Profile Completion Message */}
      {location.state?.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{location.state.message}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckIcon className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Profile Completion */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Completion
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your profile is {getCompletionPercentage()}% complete</span>
              <span className="font-medium text-gray-900">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            {getCompletionPercentage() < 100 && (
              <p className="text-sm text-gray-500 mt-2">
                Complete your profile to help with team organization
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Picture
            </h2>
            <div className="space-y-4">
              <div className="relative mx-auto w-32 h-32">
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
                    <Spinner className="text-white" />
                  </div>
                )}
                {user.profilePicUrl ? (
                  <img
                    src={user.profilePicUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircleIcon className="w-20 h-20 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <CameraIcon className="w-5 h-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  JPG or PNG. Max size 5MB.
                </p>
                {user.profilePicUrl && (
                  <Button
                    onClick={handleRemoveAvatar}
                    variant="secondary"
                    size="sm"
                    disabled={uploadingAvatar}
                  >
                    Remove Picture
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  size="sm"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Position
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {POSITIONS.map((position) => (
                      <button
                        key={position.value}
                        type="button"
                        onClick={() => handlePositionChange(position.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.preferredPosition === position.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{position.emoji}</div>
                        <div className="text-sm font-medium">{position.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This helps with team organization but doesn't guarantee position assignment
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        preferredPosition: user.preferredPosition || 'any',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900 mt-1">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="text-gray-900 mt-1">
                    {user.name || <span className="text-gray-400">Not set</span>}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Preferred Position
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl">
                      {POSITIONS.find(p => p.value === user.preferredPosition)?.emoji || '🎯'}
                    </span>
                    <p className="text-gray-900">
                      {POSITIONS.find(p => p.value === user.preferredPosition)?.label || 'Any Position'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Type
                  </label>
                  <p className="text-gray-900 mt-1">
                    {user.isAdmin ? 'Administrator' : 'Player'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Account Stats */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="text-xl font-semibold text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Matches Played</p>
              <p className="text-xl font-semibold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Availability Rate</p>
              <p className="text-xl font-semibold text-gray-900">0%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preferred Position</p>
              <p className="text-xl font-semibold text-gray-900">
                {POSITIONS.find(p => p.value === user.preferredPosition)?.emoji || '🎯'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 