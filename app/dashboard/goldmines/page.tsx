import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GoldminesTable } from '@/components/goldmines/goldmines-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
              <Gem className="h-8 w-8 text-amber-500" />
              <span>Boring Goldmines</span>
            </h1>
            <p className="text-muted-foreground">
              Established businesses with massive marketing gaps - easy wins waiting to happen
            </p>
          </div>
        </div>

        {/* Description Card */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">What Makes a Goldmine</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  These are established, successful businesses in essential service industries (plumbing, HVAC, roofing, etc.)
                  that have strong customer satisfaction but obvious digital marketing gaps. They have the budget to pay
                  for your services and the results will be immediately visible.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Why They Convert</h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                  <li><strong>Proven Business:</strong> 50+ reviews means they deliver quality work and have cash flow</li>
                  <li><strong>Obvious Gap:</strong> No website or social media makes your value proposition crystal clear</li>
                  <li><strong>Low Hanging Fruit:</strong> Simple wins like a basic website can immediately drive leads</li>
                  <li><strong>Word of Mouth:</strong> They likely get referrals but are missing out on search traffic</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identification Criteria</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Essential service industry</p>
              <p>• 30+ reviews (established)</p>
              <p>• 4.0+ Google rating</p>
              <p>• Missing website OR social</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Approach</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Lead with their reviews</p>
              <p>• Show competitor comparison</p>
              <p>• Offer quick-win package</p>
              <p>• Emphasize missed leads</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Opportunities</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Website design</p>
              <p>• Google Business optimization</p>
              <p>• Social media setup</p>
              <p>• Review management</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goldmines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gem className="h-5 w-5 text-amber-500" />
            <span>Goldmine Prospects</span>
          </CardTitle>
          <CardDescription>
            Established businesses with the highest marketing gap opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <GoldminesTable />
        </CardContent>
      </Card>
    </div>
  )
}
