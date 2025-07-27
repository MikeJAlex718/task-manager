import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check, Crown, Star, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { planAPI, authAPI } from '../services/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function PaymentPlans() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);

  // Initialize current plan from user data
  useEffect(() => {
    if (user?.plan_type) {
      // Map backend plan types to frontend plan IDs
      const planMapping: { [key: string]: string } = {
        'student': 'free',
        'student_pro': 'pro', 
        'academic_plus': 'enterprise'
      };
      const mappedPlan = planMapping[user.plan_type] || 'free';
      console.log('🔄 Initializing plan from user data:', { 
        userPlanType: user.plan_type, 
        mappedPlan,
        currentPlan 
      });
      
      // Only update if it's different to avoid unnecessary re-renders
      if (mappedPlan !== currentPlan) {
        setCurrentPlan(mappedPlan);
      }
    }
  }, [user?.plan_type]); // Only depend on plan_type, not the entire user object

  // Test backend connectivity
  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log('🔍 Testing backend connectivity...');
        const response = await fetch('http://localhost:8000/health');
        const data = await response.json();
        console.log('✅ Backend health check:', data);
      } catch (error) {
        console.error('❌ Backend not accessible:', error);
      }
    };
    
    testBackend();
  }, []);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Student',
      price: 0,
      period: 'monthly',
      features: [
        'Unlimited tasks',
        'Basic task management',
        'Simple progress tracking',
        'Email notifications',
        'Mobile responsive',
        'Basic analytics',
        'Up to 5 categories',
        'Export to PDF'
      ],
      icon: <Zap className="h-8 w-8" />,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'pro',
      name: 'Student Pro',
      price: billingPeriod === 'monthly' ? 4.99 : 49.99,
      period: billingPeriod,
      features: [
        'Everything in Student',
        'AI-powered study suggestions',
        'Advanced analytics & insights',
        'Priority support',
        'Unlimited categories',
        'Advanced export options',
        'Study session tracking',
        'Custom themes',
        'Cloud backup',
        'Team study groups'
      ],
      popular: true,
      icon: <Star className="h-8 w-8" />,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'enterprise',
      name: 'Academic Plus',
      price: billingPeriod === 'monthly' ? 9.99 : 99.99,
      period: billingPeriod,
      features: [
        'Everything in Student Pro',
        'Advanced AI tutoring',
        'Custom study plans',
        'Progress reports',
        'Integration with LMS',
        'Advanced collaboration',
        'Priority feature requests',
        'Dedicated support',
        'White-label options'
      ],
      icon: <Crown className="h-8 w-8" />,
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const handlePlanChange = async (planId: string) => {
    // Prevent multiple clicks and changes to current plan
    if (loadingPlanId || currentPlan === planId) {
      console.log('Plan change blocked:', { loadingPlanId, currentPlan, planId });
      return;
    }
    
    console.log('Starting plan change:', { planId, currentPlan });
    console.log('Current user data:', user);
    setLoadingPlanId(planId);
    
    try {
      // Map frontend plan IDs to backend plan types
      const planTypeMapping: { [key: string]: string } = {
        'free': 'student',
        'pro': 'student_pro',
        'enterprise': 'academic_plus'
      };
      
      const planType = planTypeMapping[planId];
      console.log(`🔄 Switching to ${planId} plan (${planType})`);
      console.log('Current user:', user);
      
      // Call the backend API to update the plan in Supabase
      console.log('📡 Calling planAPI.updatePlan...');
      const result = await planAPI.updatePlan(planType);
      console.log('✅ Plan update result:', result);
      
      // Update local state
      console.log('🔄 Updating local state to:', planId);
      setCurrentPlan(planId);
      
      // Refresh user data from backend to get updated plan
      console.log('🔄 Refreshing user data from backend...');
      try {
        const updatedUserData = await authAPI.getCurrentUser();
        console.log('✅ Refreshed user data:', updatedUserData);
        
        // Update the user context with fresh data from backend
        console.log('🔄 Updating user context...');
        updateUser(updatedUserData);
        
        // Double-check that the plan was updated correctly
        setTimeout(() => {
          console.log('🔍 Verifying plan update...');
          if (updatedUserData.plan_type !== planType) {
            console.warn('⚠️ Plan type mismatch:', { 
              expected: planType, 
              actual: updatedUserData.plan_type 
            });
          } else {
            console.log('✅ Plan update verified successfully');
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Failed to refresh user data:', error);
        // Fallback: update user context with plan change
        if (user) {
          console.log('🔄 Using fallback user update...');
          const updatedUser = { ...user, plan_type: planType };
          updateUser(updatedUser);
        }
      }
      
      // Show success message
      console.log(`✅ Successfully upgraded to ${plans.find(p => p.id === planId)?.name}!`);
      alert(`Successfully upgraded to ${plans.find(p => p.id === planId)?.name}!`);
      
    } catch (error) {
      console.error('❌ Plan change failed:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getCurrentPlan = () => plans.find(plan => plan.id === currentPlan);

  // Helper function to determine if button should be shown
  const shouldShowButton = (planId: string) => {
    if (currentPlan === planId) {
      return true; // Show "Current Plan" button
    }

    const planHierarchy = ['free', 'pro', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    const targetIndex = planHierarchy.indexOf(planId);

    // Check if subscription has ended (can downgrade) - including developer mode
    const subscriptionEnded = (user?.subscription_end && new Date(user.subscription_end) < new Date()) || developerMode;
    
    console.log('Button Debug:', {
      planId,
      currentPlan,
      currentIndex,
      targetIndex,
      subscriptionEnded,
      developerMode,
      shouldShow: targetIndex > currentIndex || (targetIndex < currentIndex && subscriptionEnded)
    });
    
    // For testing: if developer mode is on, show all buttons
    if (developerMode) {
      return true;
    }
    
    if (targetIndex > currentIndex) {
      return true; // Always show upgrade buttons
    } else if (targetIndex < currentIndex && subscriptionEnded) {
      return true; // Show downgrade buttons only when subscription has ended
    }
    
    return false; // Don't show downgrade buttons during active subscription
  };

  // Helper function to get button text and styling
  const getPlanButton = (planId: string) => {
    if (currentPlan === planId) {
      return {
        text: '✓ Current Plan',
        className: 'bg-green-100 text-green-800 border-2 border-green-300 cursor-default',
        disabled: true
      };
    }

    const planHierarchy = ['free', 'pro', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    const targetIndex = planHierarchy.indexOf(planId);
    const subscriptionEnded = (user?.subscription_end && new Date(user.subscription_end) < new Date()) || developerMode;

    console.log('Button Text Debug:', {
      planId,
      currentPlan,
      currentIndex,
      targetIndex,
      subscriptionEnded,
      developerMode,
      isUpgrade: targetIndex > currentIndex,
      isDowngrade: targetIndex < currentIndex && subscriptionEnded
    });

    if (targetIndex > currentIndex) {
      // Upgrade option
      const plan = plans.find(p => p.id === planId);
      return {
        text: `Upgrade to ${plan?.name}`,
        className: plan?.popular
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
          : 'bg-gray-900 text-white hover:bg-gray-800',
        disabled: false
      };
    } else if (targetIndex < currentIndex) {
      // Downgrade option (only when subscription has ended OR developer mode is on)
      const plan = plans.find(p => p.id === planId);
      if (subscriptionEnded) {
        return {
          text: `Switch to ${plan?.name} Plan`,
          className: 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200',
          disabled: false
        };
      } else {
        return {
          text: '',
          className: '',
          disabled: true
        };
      }
    }
    
    return {
      text: '',
      className: '',
      disabled: true
    };
  };

  // Helper function to get current plan highlight color
  const getCurrentPlanHighlight = (planId: string) => {
    if (currentPlan === planId) {
      return 'ring-4 ring-green-500 bg-green-50 border-green-500';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Developer Mode Toggle */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">🔧 Developer Mode</h3>
              <p className="text-sm text-purple-700">Toggle to test different subscription states</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDeveloperMode(!developerMode)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  developerMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {developerMode ? 'Enabled' : 'Disabled'}
              </button>
              {developerMode && (
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  Subscription Ended
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          {/* Back Button */}
          <div className="flex justify-start mb-6">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Profile</span>
            </button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free plan and upgrade when you need more features. 
            All plans include unlimited tasks and student-friendly pricing.
          </p>
          
          {/* Subscription Status Indicator */}
          {(user?.subscription_end && new Date(user.subscription_end) < new Date()) || developerMode ? (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Your subscription has ended. You can now change plans.
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-8 transition-all duration-200 hover:shadow-lg flex flex-col ${
                plan.popular
                  ? 'border-blue-500 bg-white shadow-xl scale-105 z-10'
                  : 'border-gray-200 bg-white'
              } ${getCurrentPlanHighlight(plan.id)}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-white">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} text-white mb-4 shadow-lg`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/{billingPeriod === 'monthly' ? 'mo' : 'year'}</span>
                </div>
                {plan.id === 'free' && (
                  <p className="text-sm text-gray-600">Perfect for getting started</p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-4 flex-grow">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-8">
                {shouldShowButton(plan.id) && (
                  <button
                    onClick={getPlanButton(plan.id).disabled ? undefined : () => handlePlanChange(plan.id)}
                    disabled={!!loadingPlanId || getPlanButton(plan.id).disabled}
                    className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 text-base ${getPlanButton(plan.id).className}`}
                  >
                    {loadingPlanId === plan.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      getPlanButton(plan.id).text
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h4>
              <p className="text-gray-600 text-sm">No long-term contracts or hidden fees</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Access</h4>
              <p className="text-gray-600 text-sm">Get new features immediately when you upgrade</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Student Discounts</h4>
              <p className="text-gray-600 text-sm">All plans priced for student budgets</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade anytime?</h4>
              <p className="text-gray-600 text-sm">Yes! Upgrades take effect immediately. Downgrades take effect at your next billing cycle to prevent data loss.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What happens to my data when I change plans?</h4>
              <p className="text-gray-600 text-sm">Your data is always safe. When upgrading, you get access to new features. When downgrading, you keep your data but lose access to premium features.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer student discounts?</h4>
              <p className="text-gray-600 text-sm">All our plans are already priced for students! No additional discounts needed - we keep prices low for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription?</h4>
              <p className="text-gray-600 text-sm">Absolutely! Cancel anytime with no fees or penalties. You'll keep access until the end of your billing period.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions about our plans?</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Contact Student Support
          </button>
        </div>
      </div>
    </div>
  );
} 