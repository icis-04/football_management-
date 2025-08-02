import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Shield, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { authApi } from '../api/auth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PasswordStrengthIndicator } from '../components/common/PasswordStrengthIndicator';
import type { Position } from '../types';

// Custom email validation regex for stricter validation
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const signupSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine((email) => emailRegex.test(email), {
      message: 'Please enter a valid email address',
    })
    .refine((email) => {
      // Check for common typos and invalid patterns
      const invalidPatterns = [
        /\.{2,}/, // Multiple dots in a row
        /@.*@/, // Multiple @ symbols
        /^\./, // Starts with dot
        /\.$/, // Ends with dot
        /@\./, // @ followed by dot
        /\.@/, // Dot followed by @
      ];
      return !invalidPatterns.some(pattern => pattern.test(email));
    }, {
      message: 'Email format is invalid',
    })
    .refine((email) => {
      // Ensure email has a valid domain extension
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return domain.includes('.') && domain.split('.').pop()!.length >= 2;
    }, {
      message: 'Email must have a valid domain',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  preferredPosition: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward', 'any'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

const positions: { value: Position; label: string }[] = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'midfielder', label: 'Midfielder' },
  { value: 'forward', label: 'Forward' },
  { value: 'any', label: 'Any Position' },
];

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const { showNotification } = useUIStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAllowed, setEmailAllowed] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      preferredPosition: 'any',
    },
  });

  const email = watch('email');
  const password = watch('password');

  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !z.string().email().safeParse(email).success) {
        setEmailAllowed(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const { allowed } = await authApi.verifyEmail(email);
        setEmailAllowed(allowed);
      } catch {
        setEmailAllowed(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const onSubmit = async (data: SignupFormData) => {
    if (emailAllowed === false) {
      showNotification({
        type: 'error',
        title: 'Email not allowed',
        message: 'This email is not authorized to register. Please contact an administrator.',
      });
      return;
    }

    try {
      await signup({
        email: data.email,
        password: data.password,
        name: data.name,
        preferredPosition: data.preferredPosition,
      });
      showNotification({
        type: 'success',
        title: 'Welcome to the team!',
        message: 'Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Signup failed',
        message: error instanceof Error ? error.message : 'Failed to create account',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Football Team Manager
        </h1>
        <h2 className="mt-6 text-center text-xl text-gray-600 dark:text-gray-300">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
                <button
                  type="button"
                  className="ml-1 inline-flex items-center"
                  title="Only pre-approved emails can register. Contact your admin if you need access."
                >
                  <HelpCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email.message}</p>
              )}
              {email && !errors.email && (
                <div className="mt-1 flex items-center text-sm">
                  {checkingEmail ? (
                    <span className="text-gray-500 dark:text-gray-400">Checking email...</span>
                  ) : emailAllowed === true ? (
                    <span className="text-success">Email is authorized</span>
                  ) : emailAllowed === false ? (
                    <span className="text-error flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Email not authorized. Contact an admin.
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="preferredPosition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred position
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  {...register('preferredPosition')}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {positions.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
              <PasswordStrengthIndicator password={password || ''} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting || emailAllowed === false}
              >
                Create account
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 