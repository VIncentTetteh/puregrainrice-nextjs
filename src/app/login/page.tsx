'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import LayoutWrapper from '@/components/LayoutWrapper'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem('pureplatter_cart')
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart)
          if (cart.length > 0) {
            router.push('/')
            return
          }
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error)
        }
      }
      router.push('/')
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
      toast.error('Failed to sign in. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4 py-16">

        {/* Background grain texture overlay */}
        <div className="fixed inset-0 bg-[url('/images/rice-pattern.png')] opacity-[0.03] pointer-events-none" />

        <div className="relative w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-[var(--charcoal)]/10 overflow-hidden">

            {/* Gold header strip */}
            <div className="h-1.5 bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold)] to-[var(--gold-dark)]" />

            <div className="px-8 py-10">

              {/* Logo */}
              <Link href="/" className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-3xl mb-3 shadow-lg shadow-[var(--gold)]/30">
                  🌾
                </div>
                <h1
                  className="text-2xl font-bold text-[var(--charcoal)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  PureGrain Rice
                </h1>
                <p className="text-xs text-[var(--charcoal-muted)] tracking-widest uppercase mt-0.5">
                  Pureplatter Foods LTD
                </p>
              </Link>

              {/* Heading */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Welcome back
                </h2>
                <p className="text-sm text-[var(--charcoal-muted)] mt-1">
                  Sign in to access your orders and dashboard
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[var(--cream-dark)]" />
                <span className="text-xs text-[var(--charcoal-muted)] uppercase tracking-widest">Continue with</span>
                <div className="flex-1 h-px bg-[var(--cream-dark)]" />
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl border-2 border-[var(--cream-dark)] bg-white text-[var(--charcoal)] text-sm font-semibold hover:border-[var(--gold)] hover:shadow-md hover:shadow-[var(--gold)]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--charcoal-muted)] border-t-transparent animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    {/* Google logo */}
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              {/* Trust line */}
              <p className="text-center text-xs text-[var(--charcoal-muted)] mt-4">
                We use Google OAuth — no password needed
              </p>

              {/* Benefits */}
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '📦', label: 'Track orders' },
                  { icon: '🛡️', label: 'Secure checkout' },
                  { icon: '⚡', label: 'Fast reorder' },
                ].map((b) => (
                  <div key={b.label} className="p-3 rounded-xl bg-[var(--cream)] border border-[var(--cream-dark)]">
                    <div className="text-xl mb-1">{b.icon}</div>
                    <p className="text-[10px] text-[var(--charcoal-muted)] font-medium leading-tight">{b.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[var(--charcoal-muted)] hover:text-[var(--gold-dark)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Store
            </Link>
          </div>

        </div>
      </div>
    </LayoutWrapper>
  )
}
