
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { ToastType } from './Toast';

interface Props {
  onLogin: (user: User) => void;
  onClose: () => void;
  showToast: (msg: string, type: ToastType, sub?: string) => void;
}

const AuthModal: React.FC<Props> = ({ onLogin, onClose, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form'); // For signup flow

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');

  const ADMIN_EMAIL = 'rumansorder43@gmail.com';
  const ADMIN_PASS = 'rumansorder43@';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isLogin) {
      // Login Logic
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        onLogin({
          id: 'admin-01',
          name: 'Admin User',
          email: ADMIN_EMAIL,
          role: 'admin',
          status: 'active',
          joinedDate: new Date().toISOString(),
          avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=22d3ee&color=fff'
        });
        onClose();
      } else if (email && password.length >= 6) {
        // Standard User Login Mock
        onLogin({
          id: `user-${Date.now()}`,
          name: 'Microstock Contributor',
          email: email,
          role: 'user',
          status: 'active',
          joinedDate: new Date().toISOString(),
          avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
        });
        onClose();
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    } else {
      // Signup Logic - GENERATE REAL CODE AND SIMULATE EMAIL
      if (email && password.length >= 6 && name) {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(generatedCode);
        
        // TRIGGER SIMULATED EMAIL NOTIFICATION
        showToast(
            `New Email from MicroStock AI`, 
            'email', 
            `Subject: Verify your account\nYour Verification Code: ${generatedCode}`
        );
        
        setStep('verify');
        setIsLoading(false);
      } else {
        setError('Please fill in all fields. Password must be 6+ chars.');
        setIsLoading(false);
      }
    }
  };

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (verificationCode === sentCode) {
        onLogin({
            id: `user-${Date.now()}`,
            name: name,
            email: email,
            role: email === ADMIN_EMAIL ? 'admin' : 'user', 
            status: 'active',
            joinedDate: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
          });
          onClose();
    } else {
        setError("Invalid code. Please check the notification and try again.");
        setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border dark:border-slate-800 border-slate-200"
        >
          {/* Decorative Header */}
          <div className="h-32 bg-gradient-to-br from-accent-cyan via-blue-600 to-purple-600 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 text-center">
              <div className="w-12 h-12 bg-white rounded-xl mx-auto mb-2 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-white font-bold text-xl">
                {step === 'verify' ? 'Verify Account' : (isLogin ? 'Welcome Back' : 'Create Account')}
              </h2>
              <p className="text-blue-100 text-xs">MicroStock AI Intelligence</p>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8">
            {step === 'verify' ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2">Check your Notifications</h3>
                  <p className="text-sm text-slate-500">
                    We've sent a verification code to <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>.
                    Please enter the code from the popup.
                  </p>
                </div>
                
                <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-accent-cyan dark:focus:border-accent-cyan dark:text-white"
                />

                {error && (
                  <p className="text-xs text-red-500 font-bold">{error}</p>
                )}
                
                <button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length < 6}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>
                
                <button 
                  onClick={() => setStep('form')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                >
                  Resend Code or Change Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-accent-cyan transition-colors" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-accent-cyan dark:focus:border-accent-cyan transition-colors dark:text-white"
                      required
                    />
                  </div>
                )}
                
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-accent-cyan transition-colors" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-accent-cyan dark:focus:border-accent-cyan transition-colors dark:text-white"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-accent-cyan transition-colors" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-accent-cyan dark:focus:border-accent-cyan transition-colors dark:text-white"
                    required
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 text-center font-medium bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                  <p className="text-sm text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => { setIsLogin(!isLogin); setError(''); }}
                      className="font-bold text-accent-cyan hover:underline"
                    >
                      {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
