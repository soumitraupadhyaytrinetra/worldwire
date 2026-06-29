import { describe, it, expect } from "vitest";
import { classifyArticle, getPrimaryCategory } from "../../src/lib/ai/classify";

describe("classifyArticle — general-news categories", () => {
  it("tags a world article as world", () => {
    const tags = classifyArticle(
      "UN Security Council debates Ukraine ceasefire as Russia advances",
      "Diplomats gathered in Brussels as the Kremlin rejected the latest proposal. NATO allies weighed new sanctions."
    );
    expect(tags).toContain("world");
  });

  it("tags a US politics article as us", () => {
    const tags = classifyArticle(
      "Senate vote on immigration bill delayed as filibuster threat grows",
      "The White House pushed back against the Speaker's proposed amendment. Congressional Democrats held a caucus."
    );
    expect(tags).toContain("us");
  });

  it("tags a business article as business", () => {
    const tags = classifyArticle(
      "Tesla shares drop after earnings miss as analysts cut price targets",
      "The EV maker reported revenue below Wall Street estimates. The Federal Reserve's rate decision weighed on markets."
    );
    expect(tags).toContain("business");
  });

  it("tags a tech article as tech", () => {
    const tags = classifyArticle(
      "OpenAI releases GPT-5 with stronger reasoning and agent capabilities",
      "The new large language model from OpenAI improves coding benchmarks. Anthropic and Google DeepMind race to ship competing LLMs."
    );
    expect(tags).toContain("tech");
  });

  it("tags a science article as science", () => {
    const tags = classifyArticle(
      "FDA approves CRISPR gene therapy for sickle cell disease",
      "The clinical trial showed sustained remission. Researchers called it a milestone for genetic medicine."
    );
    expect(tags).toContain("science");
  });

  it("tags a sports article as sports", () => {
    const tags = classifyArticle(
      "Manchester City beats Arsenal in Premier League title decider",
      "The win at the Etihad Stadium sealed the championship for Pep Guardiola's squad. Champions League qualification is now secured."
    );
    expect(tags).toContain("sports");
  });

  it("tags a culture article as culture", () => {
    const tags = classifyArticle(
      "Netflix acquires Palme d'Or winner at Cannes film festival",
      "The streaming giant paid a record sum for the auteur's new film. The deal shakes up awards-season strategy."
    );
    expect(tags).toContain("culture");
  });

  it("does NOT match old finance or commodities keywords (regression guard)", () => {
    const tags = classifyArticle(
      "Bitcoin surges past $100,000 as ETF inflows accelerate",
      "Spot bitcoin ETF inflows from institutional investors hit record."
    );
    expect(tags).not.toContain("crypto");
    expect(tags).not.toContain("banking");

    const goldTags = classifyArticle(
      "Gold price rallies as central bank reserves hit record",
      "Spot gold climbed on bullion demand."
    );
    expect(goldTags).not.toContain("gold");
  });
});

describe("getPrimaryCategory — general-news source hints", () => {
  it("falls back to source hint when article text has no keywords", () => {
    const cat = getPrimaryCategory(
      "Untitled news update",
      "no recognizable keywords here",
      "BBC World"
    );
    expect(cat).toBe("world");
  });

  it("returns tech for a tech article with tech source", () => {
    const cat = getPrimaryCategory(
      "OpenAI releases new AI agent framework",
      "openai launches a new tool for building autonomous agents",
      "The Verge"
    );
    expect(cat).toBe("tech");
  });

  it("prefers business over tech when both match (Tesla earnings case)", () => {
    const cat = getPrimaryCategory(
      "Tesla earnings: tech giant beats on AI chip revenue",
      "tesla's AI chip business drove earnings beat, stock surges",
      "Reuters Business"
    );
    // Both business and tech keywords match. Priority chain: business > tech.
    expect(cat).toBe("business");
  });

  it("prefers world over us when both match (international crisis case)", () => {
    const cat = getPrimaryCategory(
      "US and UN respond to crisis in Taiwan strait as China mobilizes",
      "the white house and united nations weigh response as beijing escalates",
      "Reuters World"
    );
    // Both world and us keywords match. Priority chain: world > us.
    expect(cat).toBe("world");
  });
});
