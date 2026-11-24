export interface MilestoneAtlasLinks {
  exploreHref: string;
  exploreLabel: string;
  related: { href: string; label: string }[];
}

const MILESTONE_LINKS: Readonly<Record<string, MilestoneAtlasLinks>> = {
  "miocene-tortonian": {
    exploreHref: "#explore?from=-7238050&to=-5000000&wrecks=0",
    exploreLabel: "~7.2–5.0 Ma",
    related: [
      { href: "#study/pre-1ma-world", label: "Play pre-1 Ma hominin study" },
      { href: "sites/world-human-family.html", label: "Human family guide" },
    ],
  },
  "nhg-onset": {
    exploreHref: "#explore?from=-3400000&to=-2000000&wrecks=0",
    exploreLabel: "~3.4–2.0 Ma",
    related: [
      { href: "#study/australopithecus", label: "Play Australopithecus study" },
      { href: "sites/world-lomekwi.html", label: "Lomekwi 3 & early tools" },
    ],
  },
  mpt: {
    exploreHref: "#explore?from=-1300000&to=-600000&wrecks=0",
    exploreLabel: "~1.3 Ma–600 ka",
    related: [
      { href: "#study/pre-1ma-world", label: "Play pre-1 Ma hominin study" },
      { href: "#origins", label: "The branching human family" },
    ],
  },
  mis12: {
    exploreHref: "#explore?from=-500000&to=-350000&wrecks=0",
    exploreLabel: "~500–350 ka",
    related: [
      { href: "#origins", label: "The branching human family" },
      { href: "sites/world-human-family.html", label: "Human family guide" },
    ],
  },
  mis5e: {
    exploreHref: "#explore?from=-135000&to=-110000&wrecks=0",
    exploreLabel: "~135–110 ka",
    related: [
      { href: "#study/neanderthals", label: "Play Neanderthals study" },
      { href: "#atlas/africa/early", label: "Africa & Middle East to 15,000 BCE" },
    ],
  },
  mis4: {
    exploreHref: "#explore?from=-75000&to=-55000&wrecks=0",
    exploreLabel: "~75–55 ka",
    related: [
      { href: "#atlas/africa/early", label: "Africa & Middle East to 15,000 BCE" },
      { href: "sites/world-human-family.html", label: "Human family guide" },
    ],
  },
  "do-oscillations": {
    exploreHref: "#explore?from=-55000&to=-25000&wrecks=0",
    exploreLabel: "~55–25 ka",
    related: [
      { href: "#study/neanderthals", label: "Play Neanderthals study" },
      { href: "sites/world-rock-art-in-toto.html", label: "Rock art gallery" },
    ],
  },
  lgm: {
    exploreHref: "#explore?from=-25000&to=-17000&wrecks=0",
    exploreLabel: "~25–17 ka",
    related: [
      { href: "sites/world-britain-ireland-ice-age.html", label: "Britain & Ireland in the Ice Age" },
      { href: "#story/early-american-evidence", label: "Early Americas arrivals" },
    ],
  },
  mwp1a: {
    exploreHref: "#explore?from=-15500&to=-12500&wrecks=0",
    exploreLabel: "~15.5–12.5 ka",
    related: [
      { href: "#story/early-american-evidence", label: "Early Americas arrivals" },
      { href: "#atlas/pacific", label: "Australia & Pacific atlas" },
    ],
  },
  "younger-dryas": {
    exploreHref: "#explore?from=-11499&to=-9499&wrecks=0",
    exploreLabel: "11,500–9,500 BCE",
    related: [
      { href: "sites/world-gobekli-catalhoyuk-anatolia.html", label: "Göbekli Tepe & Çatalhöyük" },
      { href: "#atlas/africa", label: "Africa & Middle East atlas" },
    ],
  },
  "ahp-holocene": {
    exploreHref: "#explore?from=-7999&to=-3999&wrecks=0",
    exploreLabel: "8000–4000 BCE",
    related: [
      { href: "sites/world-africa-middle-east-art-habitations.html", label: "Green Sahara & early villages" },
      { href: "#atlas/africa", label: "Africa & Middle East atlas" },
    ],
  },
  "42ka-event": {
    exploreHref: "#explore?from=-2499&to=-1899&wrecks=0",
    exploreLabel: "2500–1900 BCE",
    related: [
      { href: "sites/world-mohenjo-daro-harappa-indus.html", label: "Indus cities guide" },
      { href: "sites/world-pyramids-memphis-thebes.html", label: "Memphis, Saqqara & Thebes" },
    ],
  },
  "lalia-536": {
    exploreHref: "#explore?from=500&to=650&wrecks=0",
    exploreLabel: "500–650 CE",
    related: [
      { href: "#study/silk-roads", label: "Play Silk Roads study" },
      { href: "#atlas/europe", label: "Europe atlas" },
    ],
  },
  mca: {
    exploreHref: "#explore?from=900&to=1300&wrecks=0",
    exploreLabel: "900–1300 CE",
    related: [
      { href: "sites/chaco.html", label: "Chaco Canyon guide" },
      { href: "sites/world-greenland-history.html", label: "Greenland history guide" },
    ],
  },
  "lia-1600": {
    exploreHref: "#explore?from=1450&to=1800&wrecks=0",
    exploreLabel: "1450–1800 CE",
    related: [
      { href: "sites/world-iceland-history.html", label: "Iceland history guide" },
      { href: "#atlas/europe", label: "Europe atlas" },
    ],
  },
  "tambora-1815": {
    exploreHref: "#explore?from=1800&to=1830&wrecks=0",
    exploreLabel: "1800–1830 CE",
    related: [
      { href: "#atlas/asia-pacific", label: "Asia atlas" },
      { href: "#movie", label: "Americas atlas" },
    ],
  },
};

export function milestoneAtlasLinks(milestoneId: string): MilestoneAtlasLinks | undefined {
  return MILESTONE_LINKS[milestoneId];
}
