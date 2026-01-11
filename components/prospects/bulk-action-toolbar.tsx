'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Trash2,
    Phone,
    CheckCircle,
    Tag,
    X,
    Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface BulkActionToolbarProps {
    selectedIds: string[]
    onClearSelection: () => void
    onActionComplete: () => void
}

export function BulkActionToolbar({
    selectedIds,
    onClearSelection,
    onActionComplete,
}: BulkActionToolbarProps) {
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { toast } = useToast()

    const performBulkAction = async (action: string, tag?: string) => {
        try {
            setLoading(true)

            const response = await fetch('/api/prospects/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    prospectIds: selectedIds,
                    tag,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Action failed')
            }

            const actionMessages: Record<string, string> = {
                delete: `Deleted ${data.affected} prospects`,
                markContacted: `Marked ${data.affected} prospects as contacted`,
                markConverted: `Marked ${data.affected} prospects as converted`,
                addTag: `Added tag to ${data.affected} prospects`,
            }

            toast({
                title: "Success",
                description: actionMessages[action] || `Updated ${data.affected} prospects`,
            })

            onClearSelection()
            onActionComplete()
        } catch (error) {
            console.error('Bulk action error:', error)
            toast({
                title: "Action Failed",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        await performBulkAction('delete')
        setShowDeleteConfirm(false)
    }

    if (selectedIds.length === 0) {
        return null
    }

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
                >
                    <div className="backdrop-blur-xl bg-gray-900/90 border border-gray-700 rounded-2xl px-6 py-4 shadow-2xl flex items-center space-x-4">
                        {/* Selection count */}
                        <div className="flex items-center space-x-2 pr-4 border-r border-gray-700">
                            <span className="text-cyan-400 font-semibold text-lg">{selectedIds.length}</span>
                            <span className="text-gray-400 text-sm">selected</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => performBulkAction('markContacted')}
                                disabled={loading}
                                className="text-gray-300 hover:text-white hover:bg-gray-800"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
                                Mark Contacted
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => performBulkAction('markConverted')}
                                disabled={loading}
                                className="text-gray-300 hover:text-white hover:bg-gray-800"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Mark Converted
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={loading}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>
                        </div>

                        {/* Clear selection */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            disabled={loading}
                            className="text-gray-400 hover:text-white hover:bg-gray-800 ml-2"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-gray-900 border border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Prospects</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete {selectedIds.length} prospect{selectedIds.length > 1 ? 's' : ''}?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
