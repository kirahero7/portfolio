import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminAuthModalProps {
  isOpen: boolean;
  correctPassword?: string;
  onSuccess: (remember: boolean) => void;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  correctPassword = 'admin',
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('請輸入管理者通行密碼');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const expected = (correctPassword || 'admin').trim();
    if (password.trim() === expected) {
      setErrorMsg('');
      onSuccess(remember);
    } else {
      setErrorMsg('通行密碼錯誤，請重新輸入');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-md bg-[#141c26] border ${
            errorMsg ? 'border-red-500/80 shadow-red-950/40' : 'border-slate-700 shadow-2xl'
          } p-6 sm:p-7 text-white z-10 rounded-sm shadow-2xl ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon and Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded bg-[#1e293b] border border-slate-700 flex items-center justify-center text-indigo-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide text-white">
                管理者身分驗證
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ADMIN ACCESS VERIFICATION
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            此為作品集的私人管理後台。請輸入專屬通行密碼以解鎖管理與新增作品權限。
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">
                通行密碼 (Password)
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="請輸入密碼..."
                  className="w-full bg-[#182330] border border-slate-700 px-3.5 py-2.5 pr-10 text-sm text-white focus:border-white focus:outline-none tracking-wider font-mono placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  title={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-700 bg-[#182330] text-indigo-500 focus:ring-0"
              />
              <span>記住此瀏覽器的管理員登入狀態（7 天內免重複輸入）</span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-white text-black hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>解鎖進入後台</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
