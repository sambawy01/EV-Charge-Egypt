import { supabase } from '../config/supabase';
import { featureFlags } from '../config/featureFlags';

export type AdPlacement = 'charging_wait' | 'post_charge' | 'amenity' | 'digest' | 'ai_contextual';

export interface Ad {
  id: string;
  advertiser_name: string;
  placement: AdPlacement;
  title: string;
  description: string | null;
  image_url: string | null;
  action_url: string | null;
  target_area: string | null;
}

const MOCK_ADS: Record<AdPlacement, Ad[]> = {
  charging_wait: [
    {
      id: 'mock-1',
      advertiser_name: 'Starbucks Egypt',
      placement: 'charging_wait',
      title: 'Starbucks 50m away',
      description: '10% off your next order while your car charges!',
      image_url: null,
      action_url: 'https://starbucks.eg',
      target_area: null,
    },
    {
      id: 'mock-2',
      advertiser_name: 'Costa Coffee',
      placement: 'charging_wait',
      title: 'Costa Coffee — Free WiFi',
      description: 'Enjoy free WiFi and a warm drink. 2 min walk.',
      image_url: null,
      action_url: null,
      target_area: null,
    },
  ],
  post_charge: [
    {
      id: 'mock-3',
      advertiser_name: 'AutoMark BMW',
      placement: 'post_charge',
      title: 'BMW iX Test Drive',
      description: 'Book a free test drive at AutoMark Cairo.',
      image_url: null,
      action_url: 'https://automark.eg',
      target_area: null,
    },
  ],
  amenity: [
    {
      id: 'mock-4',
      advertiser_name: 'Mall of Arabia',
      placement: 'amenity',
      title: 'Weekend Sale at Mall of Arabia',
      description: 'Up to 50% off this weekend. Free chargers in the parking!',
      image_url: null,
      action_url: null,
      target_area: '6th October',
    },
  ],
  digest: [],
  ai_contextual: [
    {
      id: 'mock-5',
      advertiser_name: 'AXA Insurance',
      placement: 'ai_contextual',
      title: 'EV Insurance — 20% Off',
      description: 'Comprehensive EV coverage from AXA Egypt.',
      image_url: null,
      action_url: 'https://axa.eg',
      target_area: null,
    },
  ],
};

export const adService = {
  async getAds(placement: AdPlacement, area?: string): Promise<Ad[]> {
    if (!featureFlags.ADS_ENABLED) return MOCK_ADS[placement] || [];

    let query = supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .eq('placement', placement)
      .limit(3);
    if (area) query = (query as any).eq('target_area', area);
    const { data, error } = await query;
    if (error) return MOCK_ADS[placement] || [];
    return data || [];
  },

  async trackImpression(adId: string): Promise<void> {
    // In production: use supabase.rpc('increment_ad_impression', { ad_id: adId })
    await supabase.from('ads').update({ impressions: 0 } as any).eq('id', adId);
  },

  async trackClick(adId: string): Promise<void> {
    // In production: use supabase.rpc('increment_ad_click', { ad_id: adId })
    await supabase.from('ads').update({ clicks: 0 } as any).eq('id', adId);
  },
};
