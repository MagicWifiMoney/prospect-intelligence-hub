'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, Star, Users, Globe, Phone, TrendingUp, Award } from "lucide-react"

export function LeadScoringInfo({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            How Lead Scoring Works
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600" />
            Lead Scoring Algorithm
          </DialogTitle>
          <DialogDescription>
            Understand how we calculate lead scores (0-100) and identify hot leads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overview */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Scoring Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Every prospect receives a <strong>lead score from 0-100</strong> based on six key factors. 
                Higher scores indicate better quality leads that are more likely to convert.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">70-100</div>
                  <div className="text-xs text-muted-foreground">Hot Leads</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">50-69</div>
                  <div className="text-xs text-muted-foreground">Warm Leads</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-gray-600">0-49</div>
                  <div className="text-xs text-muted-foreground">Cold Leads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Factors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scoring Factors (Total: 100 Points)</h3>
            
            {/* Factor 1: Google Rating */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  1. Google Rating (25 points max)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> (rating ÷ 5) × 25
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">5.0⭐ = 25 pts</div>
                  <div className="p-2 bg-muted rounded">4.8⭐ = 24 pts</div>
                  <div className="p-2 bg-muted rounded">4.5⭐ = 22.5 pts</div>
                  <div className="p-2 bg-muted rounded">4.0⭐ = 20 pts</div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: Higher ratings indicate quality service and customer satisfaction
                </p>
              </CardContent>
            </Card>

            {/* Factor 2: Review Count */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  2. Review Count (20 points max)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> min((reviews ÷ 200) × 20, 20)
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">200+ reviews = 20 pts</div>
                  <div className="p-2 bg-muted rounded">100 reviews = 10 pts</div>
                  <div className="p-2 bg-muted rounded">50 reviews = 5 pts</div>
                  <div className="p-2 bg-muted rounded">20 reviews = 2 pts</div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: More reviews = established business with proven track record
                </p>
              </CardContent>
            </Card>

            {/* Factor 3: Website */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  3. Website Presence (15 points)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> Has website = 15 pts, No website = 0 pts
                </p>
                <div className="p-2 bg-muted rounded text-sm">
                  ✅ Website present = 15 points
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: Professional web presence indicates serious business operations
                </p>
              </CardContent>
            </Card>

            {/* Factor 4: Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-5 w-5 text-orange-500" />
                  4. Contact Information (10 points max)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> Phone + Email = 10 pts, Either = 5 pts
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">📞 + ✉️ = 10 pts</div>
                  <div className="p-2 bg-muted rounded">📞 or ✉️ = 5 pts</div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: Multiple contact methods = easier to reach and more professional
                </p>
              </CardContent>
            </Card>

            {/* Factor 5: Social Media */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  5. Social Media Presence (10 points)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> Has active profiles = 10 pts
                </p>
                <div className="p-2 bg-muted rounded text-sm">
                  Facebook, Instagram, LinkedIn profiles = 10 points
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: Active social presence indicates marketing sophistication
                </p>
              </CardContent>
            </Card>

            {/* Factor 6: Business Establishment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  6. Business Establishment (10 points max)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> Based on longevity indicators
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">50+ reviews = 5 pts (established)</div>
                  <div className="p-2 bg-muted rounded">Domain age 2+ years = 5 pts</div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Why it matters: Established businesses are more stable and reliable
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Hot Lead Criteria */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🔥 Hot Lead Qualification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                A prospect becomes a <strong>Hot Lead</strong> when ALL of these criteria are met:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span><strong>Lead Score ≥ 70</strong> (top tier quality)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span><strong>Google Rating ≥ 4.5⭐</strong> (excellent reputation)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span><strong>Review Count ≥ 20</strong> (proven track record)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span><strong>Has Website</strong> (professional presence)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span><strong>Has Phone Number</strong> (easy to contact)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm font-medium">Your Database: 170 Hot Leads Found</p>
                <p className="text-xs text-muted-foreground">These are your highest priority targets for outreach</p>
              </div>
            </CardContent>
          </Card>

          {/* Score Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Interpretation Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
                  <span className="text-sm font-medium">80-100 (Elite)</span>
                  <span className="text-xs text-muted-foreground">Contact immediately - highest conversion potential</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200">
                  <span className="text-sm font-medium">70-79 (Hot)</span>
                  <span className="text-xs text-muted-foreground">Priority outreach - very likely to convert</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
                  <span className="text-sm font-medium">60-69 (Warm)</span>
                  <span className="text-xs text-muted-foreground">Good prospects - schedule follow-up</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200">
                  <span className="text-sm font-medium">50-59 (Qualified)</span>
                  <span className="text-xs text-muted-foreground">Worth contacting - nurture relationship</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                  <span className="text-sm font-medium">40-49 (Average)</span>
                  <span className="text-xs text-muted-foreground">Standard outreach - lower priority</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-300">
                  <span className="text-sm font-medium">0-39 (Low)</span>
                  <span className="text-xs text-muted-foreground">Limited data or poor fit - revisit later</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Example: &ldquo;Metro Heating &amp; Cooling&rdquo;</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Google Rating: 4.9⭐</span>
                  <span className="font-mono">(4.9 ÷ 5) × 25 = <strong>24.5 pts</strong></span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Reviews: 1,918</span>
                  <span className="font-mono">max((1918 ÷ 200) × 20) = <strong>20 pts</strong></span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Website: ✅ Yes</span>
                  <span className="font-mono"><strong>15 pts</strong></span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Phone & Email: ✅ Both</span>
                  <span className="font-mono"><strong>10 pts</strong></span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Social Media: ❌ No</span>
                  <span className="font-mono"><strong>0 pts</strong></span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Established: ✅ 1,918 reviews</span>
                  <span className="font-mono"><strong>5 pts</strong></span>
                </div>
                <div className="flex justify-between p-3 bg-green-600 text-white rounded font-bold">
                  <span>TOTAL LEAD SCORE:</span>
                  <span>74.5 pts (Hot Lead 🔥)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
