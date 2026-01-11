'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonProps {
    filters?: {
        search?: string
        businessType?: string
        city?: string
        isHotLead?: string
        hasAnomalies?: string
        minScore?: string
        maxScore?: string
    }
}

export function ExportButton({ filters = {} }: ExportButtonProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleExport = async () => {
        try {
            setLoading(true)

            // Build query string from filters
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.set(key, value)
            })

            const queryString = params.toString()
            const url = `/api/prospects/export${queryString ? `?${queryString}` : ''}`

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Export failed')
            }

            // Get the blob and trigger download
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition')
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
            a.download = filenameMatch ? filenameMatch[1] : 'prospects-export.csv'

            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(downloadUrl)

            toast({
                title: "Export Complete",
                description: "Your prospects have been exported to CSV",
            })
        } catch (error) {
            console.error('Export error:', error)
            toast({
                title: "Export Failed",
                description: "There was an error exporting your prospects",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleExport}
            disabled={loading}
            variant="secondary"
            className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 hover:from-cyan-500/30 hover:to-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </>
            )}
        </Button>
    )
}
