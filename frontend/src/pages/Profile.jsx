import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  UserIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BellIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    businessAddress: {
      street: user?.businessAddress?.street || '',
      city: user?.businessAddress?.city || '',
      state: user?.businessAddress?.state || '',
      zipCode: user?.businessAddress?.zipCode || '',
      country: user?.businessAddress?.country || 'India',
    },
  });

  const [preferences, setPreferences] = useState({
    categories: user?.preferences?.categories || [],
    brands: user?.preferences?.brands || [],
    priceRange: user?.preferences?.priceRange || { min: 0, max: 100000 },
    notificationSettings: user?.preferences?.notificationSettings || {
      email: true,
      sms: false,
      whatsapp: false,
      push: true,
    },
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call to update profile would go here
      // await apiService.updateProfile(profileData);
      updateUser({ ...user, ...profileData });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call to update preferences would go here
      // await apiService.updatePreferences(preferences);
      updateUser({ ...user, preferences });
      alert('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'preferences', name: 'Preferences', icon: BellIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
  ];

  const categories = ['Food & Beverages', 'Electronics', 'Clothing', 'Home & Garden', 'Health & Beauty'];
  const brands = ['India Gate', 'Aashirvaad', 'Fortune', 'Everest', 'Tata Sampann'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <UserIcon className="h-8 w-8 text-qwipo-primary mr-2" />
          Profile Settings
        </h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-qwipo-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="inline h-4 w-4 mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingStorefrontIcon className="inline h-4 w-4 mr-1" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="inline h-4 w-4 mr-1" />
                    Business Address
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={profileData.businessAddress.street}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        businessAddress: { ...profileData.businessAddress, street: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={profileData.businessAddress.city}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        businessAddress: { ...profileData.businessAddress, city: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={profileData.businessAddress.state}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        businessAddress: { ...profileData.businessAddress, state: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={profileData.businessAddress.zipCode}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        businessAddress: { ...profileData.businessAddress, zipCode: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <span>Save Changes</span>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shopping Preferences</h2>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((category) => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={preferences.categories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferences({
                                  ...preferences,
                                  categories: [...preferences.categories, category],
                                });
                              } else {
                                setPreferences({
                                  ...preferences,
                                  categories: preferences.categories.filter(c => c !== category),
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-qwipo-primary focus:ring-qwipo-primary"
                          />
                          <span className="text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Brands
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {brands.map((brand) => (
                        <label key={brand} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={preferences.brands.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferences({
                                  ...preferences,
                                  brands: [...preferences.brands, brand],
                                });
                              } else {
                                setPreferences({
                                  ...preferences,
                                  brands: preferences.brands.filter(b => b !== brand),
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-qwipo-primary focus:ring-qwipo-primary"
                          />
                          <span className="text-sm text-gray-700">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Price Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Minimum Price</label>
                        <input
                          type="number"
                          value={preferences.priceRange.min}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            priceRange: { ...preferences.priceRange, min: parseInt(e.target.value) || 0 },
                          })}
                          className="input-field"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Maximum Price</label>
                        <input
                          type="number"
                          value={preferences.priceRange.max}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            priceRange: { ...preferences.priceRange, max: parseInt(e.target.value) || 100000 },
                          })}
                          className="input-field"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Notification Settings
                    </label>
                    <div className="space-y-3">
                      {Object.entries(preferences.notificationSettings).map(([key, value]) => (
                        <label key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notificationSettings: {
                                ...preferences.notificationSettings,
                                [key]: e.target.checked,
                              },
                            })}
                            className="rounded border-gray-300 text-qwipo-primary focus:ring-qwipo-primary"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {key} notifications
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : <span>Save Preferences</span>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Change Password</h3>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                    <button className="btn-outline">
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <button className="btn-outline">
                      Enable 2FA
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Account Activity</h3>
                      <p className="text-sm text-gray-600">View your recent account activity</p>
                    </div>
                    <button className="btn-outline">
                      View Activity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
