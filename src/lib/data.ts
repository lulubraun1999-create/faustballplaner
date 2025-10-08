
import { PlaceHolderImages } from './placeholder-images';

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageId: string;
}

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of AI: Trends to Watch in 2024',
    summary: 'Artificial intelligence is evolving at an unprecedented pace. This article explores the key trends that will shape the industry in the coming year, from generative models to ethical considerations.',
    source: 'Tech Insights',
    url: 'https://example.com/ai-trends-2024',
    imageId: '1',
  },
  {
    id: '2',
    title: 'Global Markets React to New Economic Policies',
    summary: 'A deep dive into how new fiscal policies from world governments are impacting stock markets, currency exchange rates, and investment strategies across the globe.',
    source: 'Finance Today',
    url: 'https://example.com/global-markets-react',
    imageId: '2',
  },
  {
    id: '3',
    title: 'Urban Development: Building the Smart Cities of Tomorrow',
    summary: 'Experts discuss the integration of IoT, sustainable infrastructure, and citizen-centric design in the next generation of urban environments. What does it take to build a truly smart city?',
    source: 'Metropolis Weekly',
    url: 'https://example.com/smart-cities-tomorrow',
    imageId: '3',
  },
  {
    id: '4',
    title: 'Breakthroughs in Personalized Medicine Change Patient Outcomes',
    summary: 'Genomic sequencing and targeted therapies are heralding a new era of healthcare. We look at recent breakthroughs and what they mean for patients with chronic diseases.',
    source: 'Health & Science Journal',
    url: 'https://example.com/personalized-medicine-breakthroughs',
    imageId: '4',
  },
  {
    id: '5',
    title: 'Climate Action: A Global Effort to Combat Rising Temperatures',
    summary: 'Leaders and activists gather to discuss new initiatives for renewable energy, carbon capture, and conservation efforts aimed at mitigating the effects of climate change.',
    source: 'Eco Watch',
    url: 'https://example.com/climate-action-summit',
    imageId: '5',
  },
  {
    id: '6',
    title: 'The World Stage: A Preview of the Upcoming Global Sports Tournament',
    summary: 'A look at the top contenders, rising stars, and host nation preparations for the most anticipated sporting event of the year.',
    source: 'Sports World',
    url: 'https://example.com/global-sports-preview',
    imageId: '6',
  },
];
