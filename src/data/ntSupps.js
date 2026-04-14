export const NT_SUPPS = {
  morning: [
    { id: 'nm1', name: 'L-Tyrosine', dose: '500–1000mg', nt: ['d'], why: 'Direct precursor to dopamine via the tyrosine → L-DOPA → dopamine pathway. Take on a light stomach for best absorption.', brand: 'Nootropics Depot' },
    { id: 'nm2', name: 'Alpha-GPC', dose: '300mg', nt: ['a'], why: 'Most bioavailable choline source. Crosses the blood-brain barrier and directly fuels acetylcholine synthesis.', brand: 'Nootropics Depot' },
    { id: 'nm3', name: 'CDP-Choline', dose: '250mg', nt: ['a','d'], why: 'Boosts acetylcholine AND upregulates dopamine receptors as a secondary effect. Synergistic with Alpha-GPC.', brand: 'Thorne' },
    { id: 'nm4', name: 'Omega-3 (EPA/DHA)', dose: '2000mg', nt: ['d','s'], why: 'Improves cell membrane fluidity, enhancing receptor sensitivity for dopamine and serotonin.', brand: 'Nordic Naturals' },
    { id: 'nm5', name: 'Vitamin B6 (P5P)', dose: '25–50mg', nt: ['d','s','a'], why: 'Active cofactor required for nearly every neurotransmitter synthesis reaction. Without it, precursors cannot convert.', brand: 'Thorne' },
    { id: 'nm6', name: 'Zinc', dose: '15mg', nt: ['d','s'], why: 'Critical mineral for dopamine and serotonin enzyme function. Take with food to avoid nausea.', brand: 'Thorne' },
  ],
  midday: [
    { id: 'nmd1', name: 'Mucuna Pruriens', dose: '400mg (15% L-DOPA)', nt: ['d'], why: 'Contains natural L-DOPA — the most direct dopamine precursor without a prescription. Separated from morning stack to avoid pathway competition.', brand: 'Nootropics Depot' },
    { id: 'nmd2', name: 'L-Theanine', dose: '200mg', nt: ['g'], why: 'Promotes alpha brain waves and enhances GABA signaling without sedation. Smooths out stimulatory effects from morning stack.', brand: 'Nootropics Depot' },
    { id: 'nmd3', name: 'Rhodiola Rosea', dose: '300mg', nt: ['d','s'], why: 'Mild MAO inhibitor — slows breakdown of dopamine and serotonin so they stay active longer. Also reduces mental fatigue.', brand: 'Gaia Herbs' },
  ],
  evening: [
    { id: 'ne1', name: '5-HTP', dose: '100mg', nt: ['s'], why: 'Direct serotonin precursor. Taken in the evening to avoid competing with morning dopamine precursors. Never combine with SSRIs.', brand: 'Thorne', warn: true },
    { id: 'ne2', name: "Lion's Mane", dose: '500–1000mg', nt: ['a'], why: 'Stimulates Nerve Growth Factor (NGF), supporting cholinergic neuron health and long-term acetylcholine function.', brand: 'Real Mushrooms' },
    { id: 'ne3', name: 'Ashwagandha (KSM-66)', dose: '300–600mg', nt: ['g'], why: 'Modulates GABA-A receptors and significantly reduces cortisol. Evening timing maximizes sleep quality benefits.', brand: 'Organic India' },
  ],
  bedtime: [
    { id: 'nb1', name: 'Magnesium Glycinate', dose: '400mg', nt: ['g'], why: 'Binds to GABA receptors and calms the nervous system. Glycinate form is most absorbable with no GI issues.', brand: 'Thorne' },
    { id: 'nb2', name: 'Taurine', dose: '500–1000mg', nt: ['g'], why: 'Functions as a GABA agonist — activates GABA receptors directly. Calming without morning grogginess.', brand: 'Nootropics Depot' },
    { id: 'nb3', name: 'L-Tryptophan', dose: '500mg', nt: ['s'], why: 'Upstream serotonin precursor that converts slowly overnight, providing sustained replenishment through the sleep cycle.', brand: 'iHerb' },
  ],
  weekly: [
    { id: 'nw1', name: 'SAMe', dose: '400mg', nt: ['d','s'], why: 'Supports methylation reactions for dopamine and serotonin. Use 3–4x per week, not daily, to avoid overstimulation.', brand: 'iHerb' },
    { id: 'nw2', name: 'Huperzine A', dose: '50–100mcg', nt: ['a'], why: 'Inhibits acetylcholinesterase — the enzyme that breaks down ACh. Must be cycled 3x/week MAX to prevent tolerance.', brand: 'Nootropics Depot', warn: true },
  ],
};
