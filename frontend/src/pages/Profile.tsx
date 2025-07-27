import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, PlanFeatures } from '../types';
import { authAPI, notificationAPI, planAPI } from '../services/api';
import { Crown, CheckCircle, Zap, BarChart3 } from 'lucide-react';

export default function Profile() {
  const { user: authUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    major: '',
    year_level: 1,
    bio: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showMembershipPromotion, setShowMembershipPromotion] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    dueDateAlerts: true,
    weeklyReports: false,
    milestoneEmails: true,
    marketingEmails: false
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    taskVisibility: 'private',
    analyticsSharing: false,
    dataCollection: true,
    thirdPartySharing: false
  });
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState([
    {
      id: 1,
      date: '2024-01-15',
      amount: 4.99,
      description: 'Student Pro Plan - Monthly',
      status: 'Paid',
      invoice: 'INV-2024-001'
    },
    {
      id: 2,
      date: '2024-02-15',
      amount: 4.99,
      description: 'Student Pro Plan - Monthly',
      status: 'Paid',
      invoice: 'INV-2024-002'
    },
    {
      id: 3,
      date: '2024-03-15',
      amount: 4.99,
      description: 'Student Pro Plan - Monthly',
      status: 'Paid',
      invoice: 'INV-2024-003'
    }
  ]);
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true
    }
  ]);

  const [membershipLevel, setMembershipLevel] = useState<{
    tier: 'Bronze' | 'Silver' | 'Gold' | 'None';
    monthsActive: number;
    discount: number;
    nextMilestone: string;
    daysUntilNext: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate membership level based on account creation date
  const calculateMembershipLevel = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const monthsActive = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const yearsActive = monthsActive / 12;
    
    let tier: 'Bronze' | 'Silver' | 'Gold' | 'None' = 'None';
    let discount = 0;
    let nextMilestone = '';
    let daysUntilNext = 0;
    
    if (yearsActive >= 10) {
      tier = 'Gold';
      discount = 50;
      nextMilestone = 'Maximum tier reached!';
    } else if (yearsActive >= 5) {
      tier = 'Silver';
      discount = 30;
      const nextDate = new Date(createdDate.getTime() + (10 * 365.25 * 24 * 60 * 60 * 1000));
      daysUntilNext = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextMilestone = `Gold tier (${Math.ceil(daysUntilNext / 365.25)} years)`;
    } else if (yearsActive >= 2.5) {
      tier = 'Bronze';
      discount = 15;
      const nextDate = new Date(createdDate.getTime() + (5 * 365.25 * 24 * 60 * 60 * 1000));
      daysUntilNext = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextMilestone = `Silver tier (${Math.ceil(daysUntilNext / 365.25)} years)`;
    } else {
      const nextDate = new Date(createdDate.getTime() + (2.5 * 365.25 * 24 * 60 * 60 * 1000));
      daysUntilNext = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextMilestone = `Bronze tier (${Math.ceil(daysUntilNext / 365.25)} years)`;
    }
    
    return { tier, monthsActive, discount, nextMilestone, daysUntilNext };
  };

  const loadPlanFeatures = async () => {
    try {
      console.log('🔄 Loading plan features...');
      const features = await planAPI.getPlanFeatures();
      console.log('✅ Plan features loaded:', features);
      setPlanFeatures(features);
    } catch (err) {
      console.error('Error loading plan features:', err);
      // Set default features for free plan
      setPlanFeatures({
        plan_type: 'student',
        features: {
          max_tasks: null,
          max_categories: 5,
          ai_features: false,  // AI features only for paid plans
          advanced_analytics: false,
          export_options: ['pdf'],
          collaboration: false,
          custom_themes: false,
          priority_support: false,
          study_session_tracking: false,
          cloud_backup: false,
          team_study_groups: false,
          lms_integration: false,
          custom_study_plans: false,
          progress_reports: false,
          white_label: false
        }
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setEditForm({
          full_name: userData.full_name || '',
          username: userData.username || '',
          major: userData.major || '',
          year_level: userData.year_level || 1,
          bio: userData.bio || ''
        });
        
        // Load profile picture if it exists
        if (userData.profile_picture) {
          console.log('🖼️ Loading profile picture from user data:', userData.profile_picture.substring(0, 50) + '...');
          setProfileImage(userData.profile_picture);
        } else {
          console.log('❌ No profile picture found in user data');
        }
        
        // Load plan features
        await loadPlanFeatures();
        
        // Calculate membership level
        if (userData.created_at) {
          const membership = calculateMembershipLevel(userData.created_at);
          // Only set membership level if user has earned a discount
          if (membership.tier !== 'None' && membership.discount > 0) {
            setMembershipLevel(membership);
            checkMilestoneAchievements(membership, userData.email);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  // Add effect to reload plan features when user plan changes
  useEffect(() => {
    if (user?.plan_type) {
      console.log('🔄 User plan changed, reloading plan features:', user.plan_type);
      loadPlanFeatures().catch(err => {
        console.error('Plan features failed to reload:', err);
      });
    }
  }, [user?.plan_type]); // Only depend on plan_type, not the entire user object

  const checkMilestoneAchievements = async (membership: any, email: string) => {
    // Check if user just reached a new milestone
    const milestones = [2.5, 5, 10]; // years
    const yearsActive = membership.monthsActive / 12;
    const currentMilestone = milestones.find(m => yearsActive >= m);
    
    if (currentMilestone && Math.abs(yearsActive - currentMilestone) < 0.1) {
      // Send email notification for milestone achievement
      try {
        await sendMilestoneEmail(email, membership.tier, membership.monthsActive);
        console.log(`🎉 Milestone email sent for ${membership.tier} tier!`);
      } catch (error) {
        console.error('Failed to send milestone email:', error);
      }
    }
  };

  const sendMilestoneEmail = async (email: string, tier: string, months: number) => {
    try {
      const discount = tier === 'Gold' ? 50 : tier === 'Silver' ? 30 : 15;
      const years = Math.round((months / 12) * 10) / 10;
      await notificationAPI.sendMilestoneNotification({
        email,
        tier,
        months_active: months,
        discount_percentage: discount
      });
      console.log(`📧 Milestone email sent for ${tier} tier after ${years} years!`);
    } catch (error) {
      console.error('Failed to send milestone email:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 5MB.');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        console.log('🖼️ Image uploaded successfully:', {
          fileSize: file.size,
          fileType: file.type,
          imageDataLength: imageData.length,
          imageDataPreview: imageData.substring(0, 100) + '...'
        });
        setProfileImage(imageData);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare profile update data
      const updateData: any = {
        full_name: editForm.full_name,
        username: editForm.username,
        major: editForm.major,
        year_level: editForm.year_level,
        bio: editForm.bio
      };

      // Add profile picture if uploaded
      if (profileImage) {
        console.log('💾 Saving profile picture to backend...');
        console.log('📏 Profile picture size:', profileImage.length, 'characters');
        updateData.profile_picture = profileImage;
      } else {
        console.log('⚠️ No profile image to save');
      }

      // Call API to update profile
      const updatedUser = await authAPI.updateProfile(updateData);
      
      console.log('✅ Profile update response:', {
        hasProfilePicture: !!updatedUser.profile_picture,
        profilePictureLength: updatedUser.profile_picture?.length || 0,
        profilePicturePreview: updatedUser.profile_picture?.substring(0, 100) + '...' || 'None'
      });
      
      // Update local state
      setUser(updatedUser);
      
      // Update AuthContext so sidebar shows updated profile picture
      updateUser(updatedUser);
      
      setIsEditing(false);
      
      console.log('✅ Profile updated successfully');
      console.log('🔄 AuthContext updated with new user data:', {
        hasProfilePicture: !!updatedUser.profile_picture,
        profilePictureLength: updatedUser.profile_picture?.length || 0,
        profilePicturePreview: updatedUser.profile_picture?.substring(0, 100) + '...' || 'None'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
          setEditForm({
      full_name: user.full_name || '',
      username: user.username || '',
      major: user.major || '',
      year_level: user.year_level || 1,
      bio: user.bio || ''
    });
    }
  };

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'student_pro':
        return 'Student Pro';
      case 'academic_plus':
        return 'Academic Plus';
      case 'student':
      default:
        return 'Student (Free)';
    }
  };

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-300 to-gray-500';
      case 'Bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getMembershipIcon = (tier: string) => {
    switch (tier) {
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      case 'Bronze': return '🥉';
      default: return '👤';
    }
  };

  const handleDiscountActivation = async () => {
    if (!membershipLevel || !user) return;
    
    try {
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      await notificationAPI.sendDiscountActivation({
        email: user.email,
        tier: membershipLevel.tier,
        discount_percentage: membershipLevel.discount,
        valid_until: validUntil
      });
      
      console.log(`🎁 Discount activation email sent for ${membershipLevel.tier} tier!`);
      setShowMembershipPromotion(false);
    } catch (error) {
      console.error('Failed to send discount activation email:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you absolutely sure you want to delete your account?\n\n' +
      'This action will:\n' +
      '• Permanently delete all your tasks and data\n' +
      '• Remove your account completely\n' +
      '• Cannot be undone\n\n' +
      'Type "DELETE" to confirm:'
    );
    
    if (!confirmed) return;
    
    const userInput = prompt('Type "DELETE" to confirm account deletion:');
    if (userInput !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🗑️ Attempting to delete account...');
      
      // Call the delete account API
      const response = await authAPI.deleteAccount();
      console.log('✅ Delete account response:', response);
      
      // Clear all local storage
      localStorage.clear();
      console.log('🗑️ Local storage cleared');
      
      // Clear auth context using the logout function
      logout();
      console.log('🚪 User logged out');
      
      alert('Account deleted successfully. You will be logged out.');
      
      // Use React Router navigation instead of window.location
      navigate('/login');
    } catch (error: any) {
      console.error('❌ Failed to delete account:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message || 
                         'Failed to delete account. Please try again or contact support.';
      
      alert(`Delete account failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    
    // Validate password confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    
    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setPasswordLoading(true);
      
      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
            </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Dynamic Membership Status Banner - Only show for users with actual discounts */}
      {membershipLevel && membershipLevel.tier !== 'None' && membershipLevel.discount > 0 && (
        <div className={`bg-gradient-to-r ${getMembershipColor(membershipLevel.tier)} rounded-xl p-8 text-white shadow-2xl relative overflow-hidden`}>
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full animate-bounce"></div>
            <div className="absolute top-8 right-8 w-6 h-6 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-1/4 w-4 h-4 bg-white rounded-full animate-ping"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl">{getMembershipIcon(membershipLevel.tier)}</span>
                  <h2 className="text-4xl font-bold">{membershipLevel.tier} Member</h2>
                  <span className="text-4xl">💎</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-center">
                      <span className="text-2xl">📅</span>
                      <h3 className="text-lg font-bold mt-2">Member Since</h3>
                      <p className="text-sm opacity-90">{new Date(user?.created_at || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-center">
                      <span className="text-2xl">🎁</span>
                      <h3 className="text-lg font-bold mt-2">Loyalty Reward</h3>
                      <p className="text-lg font-semibold mt-2">{membershipLevel.discount}% OFF</p>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-center">
                      <span className="text-2xl">🎯</span>
                      <h3 className="text-lg font-bold mt-2">Next Milestone</h3>
                      <p className="text-sm opacity-90">{membershipLevel.nextMilestone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowMembershipPromotion(true)}
                    className="bg-white text-gray-800 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                  >
                    🎁 Claim {membershipLevel.discount}% Loyalty Discount
                  </button>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">Limited Time!</div>
                    <div className="text-white text-sm opacity-90">Valid for 30 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Membership Discount Activation Modal */}
      {showMembershipPromotion && membershipLevel && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white shadow-lg border-4 border-gold-300">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-bold mb-2">🎉 Discount Activated!</h3>
              <p className="text-xl mb-4">Your {membershipLevel.discount}% discount is now active for 1 month!</p>
              <div className="space-y-2 mb-4">
                <p>• Valid until: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <p>• Applied to: Pro Plan subscription</p>
                <p>• Membership tier: {membershipLevel.tier}</p>
              </div>
                              <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleDiscountActivation}
                    className="bg-white text-green-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-md"
                  >
                    🎁 Activate Discount
                  </button>
                  <span className="text-gold-200 font-semibold">Email confirmation sent!</span>
                </div>
            </div>
            <button 
              onClick={() => setShowMembershipPromotion(false)}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl text-gray-400">👤</div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                📷
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{user?.full_name || 'User'}</h2>
            <p className="text-gray-600">@{user?.username || 'username'}</p>
            <p className="text-gray-600">{user?.email || 'email@example.com'}</p>
          </div>
        </div>

        {/* Profile Information */}
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <input
                type="text"
                value={editForm.major}
                onChange={(e) => setEditForm({...editForm, major: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
              <select
                value={editForm.year_level}
                onChange={(e) => setEditForm({...editForm, year_level: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>5th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <p className="mt-1 text-lg text-gray-900">{user.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="mt-1 text-lg text-gray-900">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <p className="mt-1 text-lg text-gray-900">{user.student_id}</p>
            </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Major</label>
                <p className="mt-1 text-lg text-gray-900">{user.major}</p>
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year Level</label>
              <p className="mt-1 text-lg text-gray-900">{user.year_level}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Plan</label>
              <p className="mt-1 text-lg text-gray-900">
                {planFeatures?.plan_type ? getPlanDisplayName(planFeatures.plan_type) : 'Student (Free)'}
                {planFeatures?.plan_type === 'academic_plus' && (
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                    🔧 Developer Mode
                  </span>
                )}
              </p>
            </div>

                          <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-lg text-gray-900">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
        {user.bio && !isEditing && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <p className="mt-1 text-lg text-gray-900">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Plans & Billing */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plans & Billing</h2>
        <div className="space-y-4">
          {/* Current Plan Display for Paid Users */}
          {(planFeatures?.plan_type === 'student_pro' || planFeatures?.plan_type === 'academic_plus') && (
            <div className="mt-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {planFeatures.plan_type === 'student_pro' ? 'Student Pro' : 'Academic Plus'}
                    </h4>
                    <p className="text-green-700 font-medium">Active Plan</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  {planFeatures.plan_type === 'student_pro' ? '$4.99/month' : '$9.99/month'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Plan Benefits
                  </h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-700">Unlimited tasks & categories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-700">AI-powered planning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-700">Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-700">Team collaboration</span>
                    </li>
                    {planFeatures.plan_type === 'academic_plus' && (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-gray-700">LMS integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-gray-700">White-label options</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-gray-700">Priority support</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Plan Management
                  </h5>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/payment-plans')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      Manage Plan
                    </button>
                    <button 
                      onClick={() => setShowBillingHistoryModal(true)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      View Billing History
                    </button>
                    <button 
                      onClick={() => setShowPaymentMethodModal(true)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Update Payment Method
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-green-200">
                <p className="text-sm text-green-700 text-center">
                  Thank you for being a premium user! Your support helps us continue improving the platform.
                </p>
              </div>
            </div>
          )}
          
          {/* Plan Features Display for All Users */}
          {planFeatures && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  Plan Features
                </h4>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {planFeatures.plan_type === 'student' ? 'Free Plan' : 
                   planFeatures.plan_type === 'student_pro' ? 'Pro Plan' : 'Plus Plan'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Core Features */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Core Features
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-800 font-medium">Unlimited Task Creation</span>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-800 font-medium">Priority Management</span>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-800 font-medium">Calendar Integration</span>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-800 font-medium">Cloud Sync</span>
                    </div>
                  </div>
                </div>
                
                {/* Premium Features */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Premium Features
                  </h5>
                  <div className="space-y-3">
                    {planFeatures.features?.ai_features ? (
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">AI Task Planning</span>
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-500">AI Task Planning</span>
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Pro+</span>
                      </div>
                    )}
                    
                    {planFeatures.features?.advanced_analytics ? (
                      <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">Advanced Analytics</span>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-500">Advanced Analytics</span>
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Pro+</span>
                      </div>
                    )}
                    
                    {planFeatures.features?.collaboration ? (
                      <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">Team Collaboration</span>
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-500">Team Collaboration</span>
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Pro+</span>
                      </div>
                    )}
                    
                    {planFeatures.features?.custom_themes ? (
                      <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-pink-500 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium">Custom Themes</span>
                        <span className="ml-auto text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-500">Custom Themes</span>
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Pro+</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Feature Summary */}
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Plan Summary</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 font-medium">
                        {planFeatures.features?.ai_features ? '4' : '0'} Premium Features
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700 font-medium">4 Core Features</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Plan Information - Upgrade Section for Free Users */}
          {planFeatures?.plan_type === 'student' && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Upgrade Your Experience</h4>
                <p className="text-gray-600">
                  Unlock powerful features to boost your academic productivity
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Pro Plan */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-bold text-gray-900">Student Pro</h5>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">$4.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">AI-powered task planning</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Advanced analytics & insights</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Team collaboration tools</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Custom themes & branding</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/payment-plans')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Upgrade to Pro
                  </button>
                </div>
                
                {/* Academic Plus Plan */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-bold text-gray-900">Academic Plus</h5>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                      Premium
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">$9.99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Everything in Student Pro</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">LMS integration</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">White-label options</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Priority support</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/payment-plans')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Upgrade to Plus
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  All plans include a 7-day free trial. Cancel anytime.
                </p>
              </div>
            </div>
          )}
        </div>
        
        
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
        <div className="space-y-4">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowNotificationModal(true)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-600">Manage email and push notifications</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowPrivacyModal(true)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Privacy Settings</h3>
                <p className="text-sm text-gray-600">Control your data and privacy</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-600">Permanently delete your account and data</p>
              </div>
              <span className="text-red-400">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePasswordChange();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Notification Settings Modal */}
      {showNotificationModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive important updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Task Reminders</h4>
                  <p className="text-sm text-gray-600">Get reminded about upcoming tasks</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.taskReminders}
                  onChange={(e) => setNotificationSettings({...notificationSettings, taskReminders: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Due Date Alerts</h4>
                  <p className="text-sm text-gray-600">Get alerts when tasks are due soon</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.dueDateAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, dueDateAlerts: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                  <p className="text-sm text-gray-600">Receive weekly progress summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Milestone Emails</h4>
                  <p className="text-sm text-gray-600">Celebrate your achievements</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.milestoneEmails}
                  onChange={(e) => setNotificationSettings({...notificationSettings, milestoneEmails: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                  <p className="text-sm text-gray-600">Receive updates about new features</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.marketingEmails}
                  onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Notification settings saved!');
                  setShowNotificationModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                  <p className="text-sm text-gray-600">Control who can see your profile</p>
                </div>
                <select
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value as 'public' | 'private'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public (Anyone can see your profile)</option>
                  <option value="private">Private (Only you can see your profile)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Task Visibility</h4>
                  <p className="text-sm text-gray-600">Control who can see your tasks</p>
                </div>
                <select
                  value={privacySettings.taskVisibility}
                  onChange={(e) => setPrivacySettings({...privacySettings, taskVisibility: e.target.value as 'public' | 'private'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public (Anyone can see your tasks)</option>
                  <option value="private">Private (Only you can see your tasks)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Sharing</h4>
                  <p className="text-sm text-gray-600">Allow app to share anonymized analytics</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.analyticsSharing}
                  onChange={(e) => setPrivacySettings({...privacySettings, analyticsSharing: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Data Collection</h4>
                  <p className="text-sm text-gray-600">Allow app to collect and use your data</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.dataCollection}
                  onChange={(e) => setPrivacySettings({...privacySettings, dataCollection: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Third-Party Sharing</h4>
                  <p className="text-sm text-gray-600">Allow app to share your data with third-party services</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.thirdPartySharing}
                  onChange={(e) => setPrivacySettings({...privacySettings, thirdPartySharing: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Privacy settings saved!');
                  setShowPrivacyModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Billing History Modal */}
      {showBillingHistoryModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Billing History</h3>
              <button
                onClick={() => setShowBillingHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{invoice.description}</h4>
                      <p className="text-sm text-gray-600">Invoice: {invoice.invoice}</p>
                      <p className="text-sm text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${invoice.amount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Download Invoice
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {billingHistory.length} invoices
                </p>
                <button
                  onClick={() => setShowBillingHistoryModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Payment Methods</h3>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Current Payment Methods */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Payment Methods</h4>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{method.brand}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">•••• •••• •••• {method.last4}</p>
                          <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add New Payment Method */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Add New Payment Method</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                    <textarea
                      placeholder="Enter your billing address"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="default-payment"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="default-payment" className="text-sm text-gray-700">
                      Set as default payment method
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('Payment method added successfully!');
                  setShowPaymentMethodModal(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Add Payment Method
              </button>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 