import type { LucideIcon } from 'lucide-react'
import {
  TrendingUp,
  Receipt,
  Cake,
  Home,
  Tag as TagIcon,
  PartyPopper,
  PhoneCall,
} from 'lucide-react'
import type { Channel } from './lab-data'

export type TemplateCategory =
  | 'Market'
  | 'Tax'
  | 'Anniversary'
  | 'Just Listed'
  | 'Just Sold'
  | 'Holiday'
  | 'Check-in'

export type Template = {
  id: string
  name: string
  category: TemplateCategory
  channel: Channel
  description: string
  premium: boolean
  /** short body with merge fields, rendered in previews */
  body: string
  mls?: boolean
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Market',
  'Tax',
  'Anniversary',
  'Just Listed',
  'Just Sold',
  'Holiday',
  'Check-in',
]

export const CATEGORY_ICON: Record<TemplateCategory, LucideIcon> = {
  Market: TrendingUp,
  Tax: Receipt,
  Anniversary: Cake,
  'Just Listed': Home,
  'Just Sold': TagIcon,
  Holiday: PartyPopper,
  'Check-in': PhoneCall,
}

export const SEED_TEMPLATES: Template[] = [
  {
    id: 'tpl-market-neighbors',
    name: 'What your neighbors sold for',
    category: 'Market',
    channel: 'email',
    description: 'Recorded sales on their street, with where their home stands.',
    premium: false,
    body: 'Hi {{first_name}} \u2014 the last home to sell on {{street}} closed at {{last_sale_on_street}}. Here is where yours stands.',
  },
  {
    id: 'tpl-tax-prop13',
    name: 'Your Prop 13 savings this year',
    category: 'Tax',
    channel: 'email',
    description: 'Assessed vs. market, and the tax the gap is saving them.',
    premium: false,
    body: 'Hi {{first_name}} \u2014 your assessed value is {{assessed_value}}. Prop 13 is saving you about {{annual_tax_benefit}} a year.',
  },
  {
    id: 'tpl-tax-prop19',
    name: 'Prop 19 may move with you',
    category: 'Tax',
    channel: 'sms',
    description: 'A short text opening the Prop 19 conversation.',
    premium: true,
    body: '{{first_name}}, if you ever move you may be able to carry your low assessment with you. Worth 10 minutes? \u2014 {{agent_first_name}}',
  },
  {
    id: 'tpl-anniv-oneyear',
    name: 'One year in your home',
    category: 'Anniversary',
    channel: 'email',
    description: 'A warm note on their purchase anniversary.',
    premium: false,
    body: 'Happy anniversary, {{first_name}} \u2014 {{years_owned}} years on {{street}}. Still glad we found it.',
  },
  {
    id: 'tpl-justlisted-street',
    name: 'A house just listed on your street',
    category: 'Just Listed',
    channel: 'email',
    description: 'Fires when a nearby home hits the market.',
    premium: true,
    body: '{{first_name}}, a home just listed on {{street}}. Curious what it means for your value?',
    mls: true,
  },
  {
    id: 'tpl-justsold-street',
    name: 'A house just sold near you',
    category: 'Just Sold',
    channel: 'email',
    description: 'Recorded sale a few doors down, with the number.',
    premium: true,
    body: '{{first_name}}, a home near you just sold for {{last_sale_on_street}}. Here is how it compares.',
  },
  {
    id: 'tpl-rates',
    name: 'Rates moved \u2014 what it means for your payment',
    category: 'Market',
    channel: 'email',
    description: 'A rate-change note tied to their recorded loan.',
    premium: true,
    body: 'Hi {{first_name}} \u2014 rates shifted this week. Given the loan on record, here is what it could mean.',
  },
  {
    id: 'tpl-holiday-thanks',
    name: 'Happy Thanksgiving from Dana',
    category: 'Holiday',
    channel: 'email',
    description: 'A no-ask seasonal note.',
    premium: false,
    body: 'Happy Thanksgiving, {{first_name}}. Thank you for trusting me with your home. \u2014 {{agent_first_name}}',
  },
  {
    id: 'tpl-checkin',
    name: 'Just checking in',
    category: 'Check-in',
    channel: 'sms',
    description: 'A light touch for people who have gone quiet.',
    premium: false,
    body: 'Hi {{first_name}}, {{agent_first_name}} here \u2014 thinking of you on {{street}}. All well?',
  },
  {
    id: 'tpl-justlisted-open',
    name: 'Open house two doors down',
    category: 'Just Listed',
    channel: 'email',
    description: 'Invites them to a neighbor\u2019s open house.',
    premium: true,
    body: '{{first_name}}, there is an open house on {{street}} this weekend. Come see what buyers are paying.',
    mls: true,
  },
  {
    id: 'tpl-justsold-year',
    name: 'Your street, this year',
    category: 'Just Sold',
    channel: 'email',
    description: 'A year-end recap of recorded sales nearby.',
    premium: false,
    body: '{{first_name}}, here is every recorded sale on {{street}} this year, and where {{assessed_value}} puts you.',
  },
  {
    id: 'tpl-holiday-year',
    name: 'A look back at your year',
    category: 'Holiday',
    channel: 'email',
    description: 'A December wrap-up with a personal note.',
    premium: false,
    body: '{{first_name}}, {{years_owned}} years in and the block keeps climbing. Here is your year on {{street}}.',
  },
]
