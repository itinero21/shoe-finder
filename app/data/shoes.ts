export interface Shoe {
  id: string;
  brand: string;
  model: string;
  category: string;
  cushion: string;
  terrain: string;
  notes: string;
  image: string;
}

export const SHOES: Shoe[] = [
  {
    id: '1',
    brand: 'Saucony',
    model: 'Triumph',
    category: 'Neutral',
    cushion: 'Max',
    terrain: 'Road',
    notes: 'Plush, premium daily trainer for long runs',
    image: 'https://www.saucony.com/dw/image/v2/BDCR_PRD/on/demandware.static/-/Sites-SauconyMaster-catalog/default/dw53f1e6d4/images/large/S20739-40_1.jpg'
  },
  {
    id: '2',
    brand: 'Saucony',
    model: 'Axon',
    category: 'Neutral',
    cushion: 'High',
    terrain: 'Road',
    notes: 'Budget-friendly max cushion',
    image: 'https://www.saucony.com/dw/image/v2/BDCR_PRD/on/demandware.static/-/Sites-SauconyMaster-catalog/default/dw4a2b8c9e/images/large/S20776-1_1.jpg'
  },
  {
    id: '3',
    brand: 'Hoka',
    model: 'Bondi',
    category: 'Neutral',
    cushion: 'Max',
    terrain: 'Road',
    notes: 'Max cushioned, injury-friendly',
    image: 'https://www.hoka.com/dw/image/v2/BFCQ_PRD/on/demandware.static/-/Sites-masterCatalog_Hoka/default/dw2e8f3a15/images/large/1127952-BBLC-1.jpg'
  },
  {
    id: '4',
    brand: 'Brooks',
    model: 'Adrenaline GTS',
    category: 'Stability',
    cushion: 'High',
    terrain: 'Road',
    notes: 'Balanced support, reliable classic',
    image: 'https://www.brooksrunning.com/dw/image/v2/BGKR_PRD/on/demandware.static/-/Sites-brooks-master-catalog/default/dw74e8e4a5/original/110381-1D-064-HERO.png'
  },
  {
    id: '5',
    brand: 'Asics',
    model: 'Gel-Kayano',
    category: 'Stability',
    cushion: 'Max',
    terrain: 'Road',
    notes: 'Premium support shoe for flat feet',
    image: 'https://images.asics.com/is/image/asics/1011B492_020_SR_RT_GLB?$sfcc-product$'
  },
  {
    id: '6',
    brand: 'Altra',
    model: 'Lone Peak',
    category: 'Trail',
    cushion: 'Moderate',
    terrain: 'Trail',
    notes: 'Versatile zero-drop trail shoe',
    image: 'https://cdn.shopify.com/s/files/1/0156/6319/4633/products/AL0A7R6M_LonePeak7_Mens_Navy_RightSide_1000x1000.jpg'
  },
  {
    id: '7',
    brand: 'On',
    model: 'Cloudboom Echo',
    category: 'Racing',
    cushion: 'High',
    terrain: 'Road',
    notes: "On's carbon-plated marathon super shoe",
    image: 'https://www.on-running.com/dw/image/v2/BDCR_PRD/on/demandware.static/-/Sites-on-master-catalog/default/dw3a8b9c4e/images/large/3MD30631584_1.jpg'
  }
];

export const DAILY_TIPS = [
  {
    category: 'Injury Prevention',
    tips: [
      'Replace running shoes every 300-500 miles to maintain proper cushioning.',
      'Rotate between 2-3 pairs of shoes to vary stress on your feet and legs.',
      'Listen to your body - pain is a signal to rest or seek professional help.',
      'Gradually increase mileage by no more than 10% per week.',
      'Include strength training 2-3 times per week to prevent injuries.'
    ]
  },
  {
    category: 'Training Advice',
    tips: [
      '80% of your runs should be at an easy, conversational pace.',
      'Include one rest day per week in your training schedule.',
      'Practice race-day nutrition and hydration during long runs.',
      'Focus on form: quick cadence, slight forward lean, midfoot strike.',
      'Cross-train with cycling or swimming to build aerobic fitness.'
    ]
  },
  {
    category: 'Shoe Care',
    tips: [
      'Remove insoles and let shoes air dry after wet runs.',
      'Never put running shoes in the dryer - air dry only.',
      'Use a soft brush to clean mud and dirt from the outsole.',
      'Store shoes in a cool, dry place away from direct sunlight.',
      'Consider using shoe trees to maintain shape between runs.'
    ]
  }
];

export const COMMUNITY_POLLS = [
  {
    question: 'Most popular shoe for marathon runners',
    results: [
      { shoe: 'On Cloudboom Echo', percentage: 28 },
      { shoe: 'Saucony Triumph', percentage: 22 },
      { shoe: 'Hoka Bondi', percentage: 18 },
      { shoe: 'Brooks Adrenaline GTS', percentage: 15 },
      { shoe: 'Other', percentage: 17 }
    ]
  },
  {
    question: 'Best shoe for beginners',
    results: [
      { shoe: 'Brooks Adrenaline GTS', percentage: 35 },
      { shoe: 'Saucony Triumph', percentage: 28 },
      { shoe: 'Hoka Bondi', percentage: 20 },
      { shoe: 'Asics Gel-Kayano', percentage: 12 },
      { shoe: 'Other', percentage: 5 }
    ]
  },
  {
    question: 'Most comfortable cushioning',
    results: [
      { shoe: 'Hoka Bondi', percentage: 42 },
      { shoe: 'Saucony Triumph', percentage: 25 },
      { shoe: 'Saucony Axon', percentage: 18 },
      { shoe: 'Asics Gel-Kayano', percentage: 10 },
      { shoe: 'Other', percentage: 5 }
    ]
  }
];