'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Phone, MessageSquare, CheckCircle, Loader2,
    Zap, ArrowRight, PhoneOff, Smartphone, Sparkles
} from 'lucide-react'

interface DemoClientProps {
    prospect: {
        id: string
        companyName: string
        businessType: string | null
        city: string | null
        auditHeroImageUrl: string | null
        demoLocationId: string | null
        demoStatus: string | null
        demoTriggeredAt: Date | null
    }
}

type DemoStep = 'intro' | 'phone-input' | 'triggering' | 'check-phone' | 'success'

export function DemoClient({ prospect }: DemoClientProps) {
    const [step, setStep] = useState<DemoStep>('intro')
    const [phone, setPhone] = useState('')
    const [firstName, setFirstName] = useState('')
    const [error, setError] = useState('')

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '')
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setPhone(formatted)
    }

    const triggerDemo = async () => {
        if (phone.replace(/\D/g, '').length < 10) {
            setError('Please enter a valid phone number')
            return
        }

        setError('')
        setStep('triggering')

        try {
            const response = await fetch('/api/demo/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospectId: prospect.id,
                    phone: phone.replace(/\D/g, ''),
                    firstName: firstName || 'Demo User',
                }),
            })

            if (response.ok) {
                setStep('check-phone')
                // Auto-advance after 8 seconds
                setTimeout(() => setStep('success'), 8000)
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to trigger demo')
                setStep('phone-input')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setStep('phone-input')
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white font-body selection:bg-purple-500/30">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <div className="max-w-lg w-full">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Intro */}
                        {step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Zap className="h-10 w-10 text-white" />
                                </div>

                                <h1 className="text-4xl font-bold font-display mb-4">
                                    Experience It Live
                                </h1>

                                <p className="text-xl text-gray-300 mb-2">
                                    {prospect.companyName}
                                </p>

                                <p className="text-gray-500 mb-10">
                                    I&apos;ve built a working demo just for you. In 30 seconds, you&apos;ll see exactly what your customers will experience.
                                </p>

                                <div className="glass rounded-2xl p-6 mb-8 text-left">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-purple-400" />
                                        Here&apos;s what happens:
                                    </h3>
                                    <ul className="space-y-3 text-gray-300">
                                        <li className="flex items-start gap-3">
                                            <PhoneOff className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
                                            <span>A customer calls you but you&apos;re busy</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <MessageSquare className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                                            <span>They instantly get a friendly text</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                                            <span>You never lose another lead</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => setStep('phone-input')}
                                    className="w-full py-4 px-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                >
                                    Try It Now
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Phone Input */}
                        {step === 'phone-input' && (
                            <motion.div
                                key="phone-input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                    <Smartphone className="h-10 w-10 text-white" />
                                </div>

                                <h2 className="text-3xl font-bold font-display mb-4">
                                    Enter Your Phone
                                </h2>

                                <p className="text-gray-400 mb-8">
                                    We&apos;ll send you a real text message so you can experience the automation firsthand.
                                </p>

                                <div className="space-y-4 mb-8">
                                    <input
                                        type="text"
                                        placeholder="Your first name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center text-lg"
                                    />

                                    <input
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center text-2xl font-mono"
                                    />
                                </div>

                                {error && (
                                    <p className="text-rose-400 mb-4">{error}</p>
                                )}

                                <button
                                    onClick={triggerDemo}
                                    className="w-full py-4 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                                >
                                    Send Me the Demo Text
                                    <MessageSquare className="h-5 w-5" />
                                </button>

                                <p className="text-xs text-gray-600 mt-4">
                                    Standard message rates may apply. Demo only.
                                </p>
                            </motion.div>
                        )}

                        {/* Step 3: Triggering */}
                        {step === 'triggering' && (
                            <motion.div
                                key="triggering"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                    <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                                </div>

                                <h2 className="text-2xl font-bold mb-4">
                                    Simulating Missed Call...
                                </h2>

                                <p className="text-gray-400">
                                    Setting up your personalized demo
                                </p>
                            </motion.div>
                        )}

                        {/* Step 4: Check Phone */}
                        {step === 'check-phone' && (
                            <motion.div
                                key="check-phone"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                >
                                    <Phone className="h-12 w-12 text-white" />
                                </motion.div>

                                <h2 className="text-3xl font-bold font-display mb-4">
                                    Check Your Phone! 📱
                                </h2>

                                <p className="text-xl text-gray-300 mb-6">
                                    You should receive a text in the next few seconds...
                                </p>

                                <div className="glass rounded-2xl p-6 text-left mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                                        <MessageSquare className="h-4 w-4" />
                                        Preview of what you&apos;ll receive:
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-xl p-4 text-emerald-200">
                                        &ldquo;Hey {firstName || 'there'}! Sorry I missed your call. How can I help you today?&rdquo;
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep('success')}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    I received it →
                                </button>
                            </motion.div>
                        )}

                        {/* Step 5: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                    className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                >
                                    <CheckCircle className="h-12 w-12 text-white" />
                                </motion.div>

                                <h2 className="text-3xl font-bold font-display mb-4">
                                    That&apos;s the Magic! ✨
                                </h2>

                                <p className="text-xl text-gray-300 mb-8">
                                    Every missed call → instant response → never lose a lead again.
                                </p>

                                <div className="glass rounded-2xl p-6 mb-8">
                                    <h3 className="font-semibold mb-4">This is already built for {prospect.companyName}</h3>
                                    <p className="text-gray-400 mb-4">
                                        Your automation is ready to go live. All you need to do is say yes.
                                    </p>
                                    <a
                                        href={`/sites/${prospect.id}`}
                                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                                    >
                                        View Your Full Audit
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </div>

                                <a
                                    href="#book"
                                    className="w-full py-4 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                >
                                    Let&apos;s Get You Set Up
                                    <ArrowRight className="h-5 w-5" />
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-6 left-0 right-0 text-center">
                <p className="text-gray-600 text-xs tracking-widest uppercase">
                    Powered by Alpha Prospect Intelligence
                </p>
            </div>
        </div>
    )
}
