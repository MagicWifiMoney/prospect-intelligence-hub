import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GoldminesTable } from '@/components/goldmines/goldmines-table'
import { Gem, Target, TrendingUp, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GoldminesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
              <Gem className="h-8 w-8 text-amber-400" />
              <span>Boring Goldmines</span>
            </h1>
            <p className="text-gray-400">
              Established businesses with massive marketing gaps - easy wins waiting to happen
            </p>
          </div>
        </div>

        {/* Description Card */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-amber-400 mb-2">What Makes a Goldmine</h3>
              <p className="text-sm text-gray-300">
                These are established, successful businesses in essential service industries (plumbing, HVAC, roofing, etc.)
                that have strong customer satisfaction but obvious digital marketing gaps. They have the budget to pay
                for your services and the results will be immediately visible.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-2">Why They Convert</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Proven Business:</strong> 50+ reviews means they deliver quality work and have cash flow</li>
                <li><strong className="text-white">Obvious Gap:</strong> No website or social media makes your value proposition crystal clear</li>
                <li><strong className="text-white">Low Hanging Fruit:</strong> Simple wins like a basic website can immediately drive leads</li>
                <li><strong className="text-white">Word of Mouth:</strong> They likely get referrals but are missing out on search traffic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Identification Criteria</h3>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Essential service industry</p>
            <p>• 30+ reviews (established)</p>
            <p>• 4.0+ Google rating</p>
            <p>• Missing website OR social</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Sales Approach</h3>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Lead with their reviews</p>
            <p>• Show competitor comparison</p>
            <p>• Offer quick-win package</p>
            <p>• Emphasize missed leads</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Service Opportunities</h3>
            <Globe className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Website design</p>
            <p>• Google Business optimization</p>
            <p>• Social media setup</p>
            <p>• Review management</p>
          </div>
        </div>
      </div>

      {/* Goldmines Table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Gem className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white font-display">Goldmine Prospects</h3>
          </div>
          <p className="text-sm text-gray-500">
            Established businesses with the highest marketing gap opportunities
          </p>
        </div>
        <GoldminesTable />
      </div>
    </div>
  )
}
