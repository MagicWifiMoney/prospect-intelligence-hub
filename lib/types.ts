
export interface ProspectData {
  id?: string;
  companyName: string;
  businessType?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  gbpUrl?: string;
  googleRating?: number;
  reviewCount?: number;
  yearsInBusiness?: number;
  employeeCount?: number;
  categories?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  recentReviews?: string;
  growthSignals?: string;
  techStack?: string;
  placeId?: string;
  icpScore?: number;
  dateCollected?: Date;
  qualificationSignals?: string;
  dataSource?: string;
  searchLocation?: string;
  leadScore?: number;
  sentimentScore?: number;
  isHotLead?: boolean;
  lastAnalyzed?: Date;
  aiRecommendations?: string;
  anomaliesDetected?: string;
  contactedAt?: Date;
  isConverted?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProspectAnalysis {
  leadScore: number;
  sentimentScore: number;
  isHotLead: boolean;
  aiRecommendations: string;
  anomaliesDetected: string[];
}

export interface MarketTrendData {
  category: string;
  title: string;
  content: string;
  source?: string;
  trend?: string;
  relevance?: number;
  publishedAt?: Date;
}

export interface DashboardMetrics {
  totalProspects: number;
  hotLeads: number;
  newBusinesses: number;
  averageScore: number;
  sentimentTrend: number;
  reviewActivity: number;
}

export interface FilterOptions {
  businessType?: string;
  city?: string;
  scoreRange?: [number, number];
  hasAnomalies?: boolean;
  isHotLead?: boolean;
  contactStatus?: 'all' | 'contacted' | 'not_contacted' | 'converted';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
