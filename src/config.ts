export const siteConfig = {
  name: "WorldWire",
  description: "World News for Every Beat",
  url: process.env.SITE_URL || "https://worldwire.app",
  author: "WorldWire",
  twitter: "@worldwire",
};

export const categories = [
  { id: "world", label: "World", icon: "🌍" },
  { id: "us", label: "US & Politics", icon: "🇺🇸" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "science", label: "Science & Health", icon: "🧬" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "culture", label: "Culture", icon: "🎭" },
];

export const navigation = [
  { title: "Trending", url: "/trending" },
  { title: "World", url: "/world" },
  { title: "US", url: "/us" },
  { title: "Business", url: "/business" },
  { title: "Tech", url: "/tech" },
  { title: "Science", url: "/science" },
  { title: "Sports", url: "/sports" },
  { title: "Culture", url: "/culture" },
];
