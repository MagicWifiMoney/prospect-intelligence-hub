'use client'

import { useState } from 'react'
import { Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface AuditPasswordGateProps {
    companyName: string
    onUnlock: () => void
}

export function AuditPasswordGate({ companyName, onUnlock }: AuditPasswordGateProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(false)

        // Simple client-side check (password is company name lowercase)
        const expectedPassword = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const inputPassword = password.toLowerCase().replace(/[^a-z0-9]/g, '')

        // Simulate network delay for UX
        await new Promise(resolve => setTimeout(resolve, 500))

        if (inputPassword === expectedPassword) {
            onUnlock()
        } else {
            setError(true)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center p-6">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                <div className="glass rounded-3xl p-10 text-center border border-white/10">
                    {/* Lock Icon */}
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                        <Lock className="h-8 w-8 text-cyan-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold font-display mb-2">
                        Private Audit Report
                    </h1>
                    <p className="text-gray-400 text-sm mb-8">
                        This audit was prepared exclusively for<br />
                        <span className="text-cyan-400 font-semibold">{companyName}</span>
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your company name"
                                className={`w-full px-5 py-4 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${error ? 'border-rose-500' : 'border-white/10'
                                    }`}
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-rose-400 text-sm"
                            >
                                Incorrect password. Try your company name.
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Unlock Report
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Hint */}
                    <p className="text-gray-500 text-xs mt-6">
                        Hint: The password is your company name
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6 tracking-widest uppercase">
                    Powered by Alpha Prospect Intelligence
                </p>
            </motion.div>
        </div>
    )
}
