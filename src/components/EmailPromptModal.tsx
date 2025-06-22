// components/EmailPromptModal.tsx
'use client';

import { useState } from 'react';

interface EmailPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export default function EmailPromptModal({ isOpen, onClose, onSubmit }: EmailPromptModalProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!email || !email.includes('@')) return;
    onSubmit(email);
    setEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 60 }}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Enter your email</h2>
        <input
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-rice-gold text-white rounded">Submit</button>
        </div>
      </div>
    </div>
  );
}
