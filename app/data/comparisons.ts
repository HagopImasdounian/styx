export type CuratedComparison = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  products: string[]; // product handles
  faqs: Array<{question: string; answer: string}>;
  relatedSlugs: string[];
};

export const CURATED_COMPARISONS: CuratedComparison[] = [
  // ─── Same style, different karats ───
  {
    slug: '10k-vs-14k-cuban-link',
    title: '10K vs 14K Cuban Link Chain',
    metaTitle: '10K vs 14K Cuban Link Chain — Gold Content, Price & Value Compared',
    metaDescription: 'Side-by-side comparison of 10K and 14K Cuban Link chains. Compare pure gold content, price per gram, durability, and overall value to find the right chain for you.',
    h1: '10K vs 14K Cuban Link Chain',
    intro: 'The Cuban Link is the most iconic chain style in gold jewelry. But should you go with 10K or 14K? The answer depends on your priorities — 14K contains 40% more pure gold per gram, commands a higher resale value, and has a richer color. 10K is harder (more alloy = more scratch resistance) and significantly more affordable. Here\'s how they compare on real metrics.',
    products: ['10k-5mm-cuban-link-chain', '14k-5mm-cuban-link-chain'],
    faqs: [
      {question: 'Is 14K Cuban Link worth the extra cost over 10K?', answer: '14K gold contains 58.3% pure gold vs 41.7% in 10K — that\'s 40% more actual gold. If resale value and color richness matter to you, 14K is worth it. If durability and budget are priorities, 10K offers better scratch resistance at a lower price point.'},
      {question: 'Which karat is more durable for daily wear?', answer: '10K gold is actually harder than 14K because it contains more alloy metals. For heavy daily wear, 10K will show fewer scratches. However, both karats are suitable for everyday Cuban Link chains.'},
      {question: 'Can you tell the difference between 10K and 14K by looking?', answer: 'Yes — 14K has a noticeably warmer, richer yellow tone. 10K appears slightly paler due to higher alloy content. The difference is subtle in photos but clear in person, especially in direct sunlight.'},
    ],
    relatedSlugs: ['10k-vs-14k-rope', 'solid-vs-hollow-cuban-link', '3mm-vs-5mm-cuban-link'],
  },
  {
    slug: '10k-vs-14k-rope',
    title: '10K vs 14K Rope Chain',
    metaTitle: '10K vs 14K Rope Chain — Weight, Gold Purity & Price Comparison',
    metaDescription: 'Compare 10K and 14K rope chains on gold content, weight, price per gram of pure gold, and overall value. Data-driven comparison with live gold spot pricing.',
    h1: '10K vs 14K Rope Chain',
    intro: 'Rope chains are prized for their intricate twisted construction and brilliant light reflection. When choosing between 10K and 14K, you\'re trading off between the rope\'s sparkle (14K reflects more light due to higher gold content) and affordability (10K gives you the same visual weight at a lower cost). Let\'s compare the numbers.',
    products: ['10k-2-5mm-rope-chain', '14k-2-5mm-rope-chain'],
    faqs: [
      {question: 'Does karat affect how a rope chain looks?', answer: 'Yes. 14K rope chains have a warmer golden hue and reflect light with more depth due to higher gold purity. The twisted links of a rope chain amplify this difference because they catch light at multiple angles.'},
      {question: 'Are rope chains fragile?', answer: 'Rope chains are among the strongest chain styles due to their intertwined construction. Both 10K and 14K rope chains resist kinking well, though 10K has a slight edge in hardness.'},
    ],
    relatedSlugs: ['10k-vs-14k-cuban-link', '10k-vs-14k-figaro'],
  },
  {
    slug: '10k-vs-14k-figaro',
    title: '10K vs 14K Figaro Chain',
    metaTitle: '10K vs 14K Figaro Chain — Italian Classic in Two Karats Compared',
    metaDescription: 'Compare 10K and 14K Figaro chains side by side. See gold content, price differences, and value metrics for this classic Italian chain style.',
    h1: '10K vs 14K Figaro Chain',
    intro: 'The Figaro chain — with its distinctive pattern of alternating short and long links — originated in Italy and remains one of the most popular chain styles worldwide. Here\'s how the 10K and 14K versions compare on gold content, price, and value.',
    products: ['10k-4-5mm-figaro-chain', '14k-4-5mm-figaro-chain'],
    faqs: [
      {question: 'What makes a Figaro chain different from a Cuban Link?', answer: 'A Figaro has a repeating pattern — typically 3 short links followed by 1 elongated link. Cuban Links are uniform interlocking oval links. Figaro is lighter and more delicate in appearance; Cuban is heavier and more substantial.'},
      {question: 'Is a Figaro chain good for pendants?', answer: 'Figaro chains work well with lightweight pendants. The elongated link provides a natural resting point. For heavier pendants, a rope or Cuban Link may be more appropriate.'},
    ],
    relatedSlugs: ['10k-vs-14k-cuban-link', '10k-vs-14k-rope'],
  },

  // ─── Same karat, different thickness ───
  {
    slug: '3mm-vs-5mm-cuban-link',
    title: '3mm vs 5mm Cuban Link Chain',
    metaTitle: '3mm vs 5mm Cuban Link — Thickness Comparison (Weight, Price, Look)',
    metaDescription: 'Should you get a 3mm or 5mm Cuban Link? Compare weight, gold content, price, and visual impact side by side. See which thickness suits your style.',
    h1: '3mm vs 5mm Cuban Link Chain',
    intro: 'Thickness dramatically changes how a Cuban Link chain looks and feels. A 3mm sits flat and subtle — suitable under a collar. A 5mm has visual presence and weight you can feel. The difference in gold content (and price) scales roughly with the square of the thickness. Here\'s the exact comparison.',
    products: ['14k-3mm-cuban-link-chain', '14k-5mm-cuban-link-chain'],
    faqs: [
      {question: 'How much heavier is a 5mm Cuban Link than 3mm?', answer: 'A 5mm Cuban Link typically weighs 2-3x more than a 3mm at the same length. The cross-section area scales with the square of the width, so a small increase in mm means a significant increase in gold used.'},
      {question: 'Which thickness looks better on a thinner neck?', answer: '3mm-4mm is ideal for slimmer frames and works well layered. 5mm+ makes a statement and pairs well with medium to larger builds or as a standalone piece.'},
    ],
    relatedSlugs: ['10k-vs-14k-cuban-link', 'solid-vs-hollow-cuban-link'],
  },

  // ─── Solid vs Hollow ───
  {
    slug: 'solid-vs-hollow-cuban-link',
    title: 'Solid vs Hollow Cuban Link Chain',
    metaTitle: 'Solid vs Hollow Cuban Link Chain — Durability, Weight & Price Compared',
    metaDescription: 'Is a solid Cuban Link chain worth the extra cost over hollow? Compare weight, durability, gold content per dollar, and long-term value side by side.',
    h1: 'Solid vs Hollow Cuban Link Chain',
    intro: 'The solid vs. hollow debate is one of the most important decisions in gold chain buying. Solid chains contain gold through the entire cross-section — more gold, more weight, more value retention. Hollow chains are tubular, giving the same visual size at a fraction of the weight and cost. Neither is "better" — it depends on your priorities.',
    products: ['14k-5mm-cuban-link-chain', '10k-7-5mm-hollow-cuban-link-chain'],
    faqs: [
      {question: 'Can you tell if a chain is hollow by looking at it?', answer: 'Not easily. Hollow chains are designed to look identical to solid ones. The difference is in weight — pick up both and the solid chain will feel significantly heavier for the same visual size.'},
      {question: 'Do hollow chains break easily?', answer: 'Hollow chains are more susceptible to denting and crushing because the walls are thin. They can still last years with careful wear, but they\'re not ideal for daily wear or active lifestyles. Solid chains are virtually crush-proof.'},
      {question: 'Which has better resale value?', answer: 'Solid chains retain value better because resale is based on gold weight. A solid chain contains 3-5x more gold than a hollow chain of the same visual size, meaning it holds more melt value.'},
    ],
    relatedSlugs: ['10k-vs-14k-cuban-link', '3mm-vs-5mm-cuban-link'],
  },

  // ─── Style vs Style ───
  {
    slug: 'cuban-link-vs-rope',
    title: 'Cuban Link vs Rope Chain',
    metaTitle: 'Cuban Link vs Rope Chain — Which Gold Chain Style is Better?',
    metaDescription: 'Compare Cuban Link and Rope chains on strength, appearance, weight, price, and versatility. Find out which chain style is right for your lifestyle.',
    h1: 'Cuban Link vs Rope Chain',
    intro: 'Cuban Links and Rope chains are the two most popular gold chain styles — but they serve different aesthetics. The Cuban Link is bold, flat, and hip-hop-rooted. The Rope chain is twisted, elegant, and catches light brilliantly. Here\'s how they compare spec-for-spec at the same karat and approximate thickness.',
    products: ['14k-3mm-cuban-link-chain', '14k-2-5mm-rope-chain'],
    faqs: [
      {question: 'Which is stronger, Cuban Link or Rope?', answer: 'Both are among the strongest chain styles. Cuban Links resist pulling force well due to interlocking flat links. Rope chains resist kinking due to their twisted construction. For raw tensile strength, Cuban Links have a slight edge.'},
      {question: 'Which chain style is better for layering?', answer: 'Rope chains layer beautifully because their round profile doesn\'t tangle as easily. Cuban Links can catch on each other. For multi-chain looks, mix rope chains at different lengths.'},
      {question: 'Which holds value better?', answer: 'Both hold value equally well — resale value is determined by gold weight and karat, not style. Choose based on aesthetics and how you\'ll wear it.'},
    ],
    relatedSlugs: ['cuban-link-vs-figaro', 'cuban-link-vs-franco'],
  },
  {
    slug: 'cuban-link-vs-figaro',
    title: 'Cuban Link vs Figaro Chain',
    metaTitle: 'Cuban Link vs Figaro Chain — Style, Weight & Price Side by Side',
    metaDescription: 'Cuban Link or Figaro? Compare these classic chain styles on weight, gold content, visual profile, and price per gram of pure gold.',
    h1: 'Cuban Link vs Figaro Chain',
    intro: 'The Cuban Link and Figaro are both flat-link chains with Italian heritage, but they create very different looks. Cuban Links are uniform and bold. Figaro chains alternate between small and elongated links, creating a rhythmic pattern that reads more classic and understated. Here\'s how they compare.',
    products: ['14k-5mm-cuban-link-chain', '14k-4-5mm-figaro-chain'],
    faqs: [
      {question: 'Is a Figaro chain as strong as a Cuban Link?', answer: 'Cuban Links are generally stronger due to their uniform interlocking design with no weak points. Figaro chains have elongated links that can be slightly more vulnerable to stress, though both are durable for daily wear.'},
      {question: 'Which looks better with a pendant?', answer: 'Both work well, but Figaro chains have a more classic pendant-chain look. The varying link sizes create visual interest that complements a pendant. Cuban Links make the chain itself the statement.'},
    ],
    relatedSlugs: ['cuban-link-vs-rope', 'cuban-link-vs-franco'],
  },
  {
    slug: 'cuban-link-vs-franco',
    title: 'Cuban Link vs Franco Chain',
    metaTitle: 'Cuban Link vs Franco Chain — The Two Heavyweights Compared',
    metaDescription: 'Cuban Link and Franco are both heavy, durable gold chains. Compare their construction, weight-to-width ratio, flexibility, and value metrics.',
    h1: 'Cuban Link vs Franco Chain',
    intro: 'Cuban Links and Franco chains are both premium heavy chains — the kind that make a statement. The Cuban Link is flat with interlocking oval links. The Franco has a more complex V-shaped weave that creates a square or rounded profile. Franco chains are typically more flexible and drape differently. Here\'s the full comparison.',
    products: ['14k-3mm-cuban-link-chain', '14k-3mm-franco-chain'],
    faqs: [
      {question: 'Which is heavier, Cuban Link or Franco?', answer: 'At the same width and karat, Franco chains are often slightly heavier because of their dense V-weave construction. Both are "heavy" chain styles compared to rope, cable, or figaro.'},
      {question: 'Which drapes better?', answer: 'Franco chains are more flexible and drape closer to the body in a round profile. Cuban Links sit flat and have a more structured, angular drape. Personal preference applies here.'},
    ],
    relatedSlugs: ['cuban-link-vs-rope', 'cuban-link-vs-figaro'],
  },
];

export function getComparisonBySlug(slug: string): CuratedComparison | undefined {
  return CURATED_COMPARISONS.find((c) => c.slug === slug);
}

export function getRelatedComparisons(slugs: string[]): CuratedComparison[] {
  return slugs
    .map((s) => CURATED_COMPARISONS.find((c) => c.slug === s))
    .filter(Boolean) as CuratedComparison[];
}
