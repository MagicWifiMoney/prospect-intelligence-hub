'use client'

import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'

interface IcpSegment {
  id: string
  name: string
  color: string
}

interface IcpFilterBadgeProps {
  segment: IcpSegment | null
  size?: 'sm' | 'default'
}

export function IcpFilterBadge({ segment, size = 'default' }: IcpFilterBadgeProps) {
  if (!segment) {
    return (
      <Badge
        variant="secondary"
        className={`bg-gray-800 text-gray-400 border-0 ${
          size === 'sm' ? 'text-xs py-0 px-1.5' : ''
        }`}
      >
        <Target className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
        No ICP
      </Badge>
    )
  }

  return (
    <Badge
      className={`border-0 ${size === 'sm' ? 'text-xs py-0 px-1.5' : ''}`}
      style={{
        backgroundColor: `${segment.color}20`,
        color: segment.color,
      }}
    >
      <span
        className={`rounded-full mr-1.5 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: segment.color }}
      />
      {segment.name}
    </Badge>
  )
}
