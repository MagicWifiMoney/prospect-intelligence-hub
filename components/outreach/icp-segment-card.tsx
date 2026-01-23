'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, Mail, MoreVertical, Edit, Trash2, RefreshCw, Eye, DollarSign } from 'lucide-react'

interface SegmentRules {
  minIcpScore?: number
  maxIcpScore?: number
  minLeadScore?: number
  businessTypes?: string[]
  cities?: string[]
  hasWebsite?: boolean
  hasEmail?: boolean
  minReviews?: number
  minRating?: number
  isContacted?: boolean
  isHotLead?: boolean
  needsWebsite?: boolean
}

interface IcpSegment {
  id: string
  name: string
  description: string | null
  color: string
  rules: SegmentRules
  offerTemplateId: string | null
  offerTemplate: {
    id: string
    name: string
    price: string | null
  } | null
  assignedCount: number
  matchingCount: number
}

interface IcpSegmentCardProps {
  segment: IcpSegment
  isHighPriority?: boolean
  onEdit: () => void
  onDelete: () => void
  onApply: () => void
  onSend: () => void
}

function getRulesSummary(rules: SegmentRules): string[] {
  const summary: string[] = []

  if (rules.minIcpScore !== undefined) {
    summary.push(`ICP >= ${rules.minIcpScore}`)
  }
  if (rules.minLeadScore !== undefined) {
    summary.push(`Lead >= ${rules.minLeadScore}`)
  }
  if (rules.businessTypes && rules.businessTypes.length > 0) {
    summary.push(rules.businessTypes.join(', '))
  }
  if (rules.cities && rules.cities.length > 0) {
    summary.push(rules.cities.join(', '))
  }
  if (rules.hasWebsite === false) {
    summary.push('No website')
  }
  if (rules.hasEmail === true) {
    summary.push('Has email')
  }
  if (rules.minReviews !== undefined) {
    summary.push(`${rules.minReviews}+ reviews`)
  }
  if (rules.minRating !== undefined) {
    summary.push(`${rules.minRating}+ stars`)
  }
  if (rules.isContacted === false) {
    summary.push('Not contacted')
  }
  if (rules.isHotLead === true) {
    summary.push('Hot leads')
  }
  if (rules.needsWebsite === true) {
    summary.push('Needs website')
  }

  return summary
}

export function IcpSegmentCard({
  segment,
  isHighPriority,
  onEdit,
  onDelete,
  onApply,
  onSend,
}: IcpSegmentCardProps) {
  const rulesSummary = getRulesSummary(segment.rules as SegmentRules)

  return (
    <Card
      className={`bg-[#111827] border-gray-800 hover:border-gray-700 transition-all ${isHighPriority
          ? 'ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.02]'
          : ''
        }`}
    >
      <CardHeader className="pb-3">
        {isHighPriority && (
          <div className="flex items-center space-x-2 mb-2">
            <Badge className="bg-cyan-500 text-white border-0 text-[10px] uppercase tracking-wider font-bold h-5 px-2">
              Champion Flow
            </Badge>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <CardTitle className="text-white text-lg">{segment.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1f2937] border-gray-700">
              <DropdownMenuItem onClick={onEdit} className="text-gray-200">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onApply} className="text-gray-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply Rules
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={onDelete} className="text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {segment.description && (
          <p className="text-sm text-gray-400 mt-1">{segment.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prospect Count */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a]">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span className="text-gray-300">Prospects</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{segment.matchingCount}</span>
            {segment.assignedCount !== segment.matchingCount && (
              <span className="text-sm text-gray-500 ml-2">
                ({segment.assignedCount} tagged)
              </span>
            )}
          </div>
        </div>

        {/* Linked Offer */}
        {segment.offerTemplate ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-300">{segment.offerTemplate.name}</span>
            </div>
            {segment.offerTemplate.price && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                {segment.offerTemplate.price}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-3 rounded-lg bg-gray-800/50 border border-dashed border-gray-700">
            <span className="text-sm text-gray-500">No offer linked</span>
          </div>
        )}

        {/* Rules Summary */}
        {rulesSummary.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rulesSummary.slice(0, 4).map((rule, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-gray-800 text-gray-300 text-xs"
              >
                {rule}
              </Badge>
            ))}
            {rulesSummary.length > 4 && (
              <Badge variant="secondary" className="bg-gray-800 text-gray-500 text-xs">
                +{rulesSummary.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onApply}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            onClick={onSend}
            disabled={segment.matchingCount === 0}
            className={`flex-1 ${isHighPriority
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300'
                : 'bg-cyan-500 hover:bg-cyan-600'
              }`}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Batch
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
