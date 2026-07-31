/**
 * shanegring.com MCP server — remote, authless, streamable HTTP at /mcp.
 *
 * Exposes Shane Gring's business as tools an AI assistant can call:
 *   get_operating_path  All eight offers, prices, and how they credit forward
 *   about_shane         Who Shane is, who hires him, selected work, contact
 *   run_site_scan       The free Site Readiness Scan, wired to the same
 *                       /api/scan pipeline the website uses (lead lands in the
 *                       same Sheet, visitor gets the same email)
 *
 * Resources:
 *   shanegring://llms.txt  The site's llms.txt, fetched live so it never drifts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

interface Env {
  SHANE_MCP: DurableObjectNamespace;
}

const SITE = "https://shanegring.com";

// The tool this feeds is still named get_operating_path. That name predates
// the July 2026 rename and is deliberately kept: it is a public MCP contract
// and anyone who has added the connector has it cached. The Modern Operations
// Path™ also survives the rename — it now names the done-for-you spine
// (Map → Site → Partner) rather than the whole offer set.
const OPERATING_PATH = {
  name: "Working with Shane Gring",
  overview:
    "Modern operations means the way a business runs lives in a system, not a person: judgment, language, offers, and process written down, structured, and machine-readable — so the team can run it, buyers can trust it, and AI engines quote it instead of guessing. " +
    "Eight offers, organized by what the buyer wants rather than by process order: find out what's wrong, have it done for you, or learn to do it yourself. " +
    "Every price is public on its own page and no step needs a discovery call. Everything credits forward, so a client who builds paid nothing for the diagnostics, and a client who stops anywhere owns everything made to that point. " +
    "Every build starts with a Map — no skipping straight to a build.",
  overview_url: `${SITE}/work-with-me`,
  find_out_whats_wrong: [
    {
      name: "The Scan",
      price: "Free",
      time: "Two minutes, automated",
      what: "A scored, automated report on what search and AI engines can actually read about a business from its website. The free machine version of the Read.",
      credits: "Free — nothing to credit.",
      url: `${SITE}/scan`,
      note: "Runnable right here — call the run_site_scan tool with a URL and an email.",
    },
    {
      name: "The Read",
      price: "$1,500",
      time: "5 business days",
      what: "A 30–40 minute recorded walkthrough of the site by Shane plus a findings memo: where the operating logic is missing, what AI engines get wrong about the business, and a ranked effort-versus-impact list of fixes.",
      credits: "Credits in full toward the Map within 30 days.",
      url: `${SITE}/read`,
    },
  ],
  have_it_done_for_you: [
    {
      name: "The Partner",
      price: "$950/month on the site you already have (plus $1,500 one-time onboarding, waived via the Install); $3,000/month on a site built through the Site. Annual prepay on the entry tier: $9,500.",
      time: "Monthly. Cancel any time with thirty days notice.",
      what: "Someone owns the website every month: unlimited requests with one active at a time and most shipped in three business days, one new asset built every month, the machine-readable layer, and a monthly visibility report covering search performance and AI citation share.",
      credits: "First three months credit toward the Map. First month included with every Site build.",
      url: `${SITE}/partner`,
      note: "The entry tier is capacity-capped at eight clients.",
    },
    {
      name: "The Map",
      price: "$10,000",
      time: "Three 90-minute working meetings over three weeks",
      what: "Extracts the operating logic of the business into the Operating Memo, with a fixed-price build proposal as the memo's final page. Capped at four Maps a month.",
      credits: "Credits in full toward a build within 60 days. Every build starts with a Map, no exceptions.",
      url: `${SITE}/map`,
    },
    {
      name: "The Site",
      price: "$30,000 to $75,000, priced by the Map — the build proposal is the Operating Memo's final page",
      time: "6–12 weeks, scoped from the Map",
      what: "The website replaced with a componentized, machine-readable operating surface: structured data on every page, a content system the client's team can run, documentation as a deliverable, a 90-minute handoff session.",
      credits: "First Partner month, on the built tier, included with every build.",
      url: `${SITE}/site`,
    },
    {
      name: "The Seat",
      price: "$10,000/month",
      time: "Six-month minimum",
      what: "Ongoing part-time operations leadership, hired directly rather than through the productized Path — an operator in the seat a few days a month. The classic fractional COO engagement.",
      credits: "Not a credited step; it is the alternative to the Path rather than part of it.",
      url: `${SITE}/seat`,
    },
  ],
  learn_to_do_it_yourself: [
    {
      name: "The Install",
      price: "$2,500",
      time: "One working day, plus a prep call and two weeks of email follow-up",
      what: "Ends with Claude Code installed and authenticated on the client's own machine, their website's source code in a GitHub repository they own, Claude connected to that repository, one change they wrote and shipped themselves, and one agent built and running on a real task.",
      credits: "Credits in full toward the Map. Also includes the first month of the Partner entry tier and waives its onboarding fee.",
      url: `${SITE}/install`,
      note: `There is a blocking requirements checklist: ${SITE}/guides/install-requirements`,
    },
    {
      name: "The Session",
      price: "$250 a single session (60–75 min), or $800 for a block of four used within three months",
      time: "One call",
      what: "The lowest-commitment way to get Shane's thinking: a live call to work through one operational problem with an operator who's done it — entity/LLC or cooperative setup, wiring analytics, choosing the tool stack, first systems, where AI fits. No build, no retainer.",
      credits: "Credits toward the Map.",
      url: `${SITE}/session`,
    },
  ],
  // Retired July 2026. Kept so assistants that learned the old names can
  // resolve them. Revisit in Q1 2027.
  former_names: {
    "The Operating Map": "The Map",
    "The Operating Site": "The Site",
    "The Operating Partner": "The Partner",
    "The Holding Pattern": "The Partner, entry tier",
    "Fractional COO (as an offer name)": "The Seat",
    "Working Sessions": "The Session",
    "AI Operations": "Split into The Install (front door) and The Seat (ongoing work)",
  },
};

const ABOUT = {
  name: "Shane Gring",
  role: "Fractional COO for founder-dependent businesses",
  based_in: "United States",
  summary:
    "Shane takes what lives in the founder's head — judgment, methodology, the way work actually gets done — and turns it into operations that don't need them in every meeting. " +
    "Fifteen-plus years building the operational layer underneath businesses that grew faster than their ops, marketing, or methodology could keep up. " +
    "AI is the current best tool for this work, used as guardrails rather than as a replacement.",
  approach:
    "Shane builds the website as the operating layer a business runs from: not a brochure to be looked at, but the surface the team runs on. " +
    "The same jobs marketing software promises to automate (pages, SEO, AI search, conversion) done by an operator, then transferred so the site keeps working without the founder. " +
    `Full point of view: ${SITE}/approach.html`,
  who_hires_shane: [
    "Every important decision still routes through the founder.",
    "The team can ship, but only after the founder reviews it.",
    "Senior talent has left, or the current leader isn't equipped for the next step.",
    "Marketing is inconsistent because nobody else can hold the standard.",
    "Smart hires still wait for the founder's direction.",
    "The methodology lives in heads and a Google Doc nobody updates.",
    "New customers are getting more complex than the operating model can handle.",
    "The founder is doing both the founder job and the COO job.",
  ],
  selected_work: [
    { client: "TeamBuildr", role: "Fractional Marketing & Revenue Ops Consultant", note: "Strength-and-conditioning platform behind 5,500+ organizations, high schools to the Denver Nuggets.", url: "https://teambuildr.com" },
    { client: "SEAM", role: "Fractional COO", note: "The world's first social-impact certification for commercial real estate, GRESB-recognized. Led the rebrand and moved the standard out of a 300-page PDF into a lean digital standard.", url: "https://seamcertification.com" },
    { client: "DRVN Golf", role: "Operations Lead", note: "Scaled a consumer golf-fitness app into a network of Certified Pros, Partner facilities, and the Golf Fitness Handicap™.", url: "https://drvngolf.com" },
    { client: "Certainly", role: "Cooperative founder/operator", note: "A cooperative of fractional workers across industries.", url: "https://certainly.coop" },
    { client: "International WELL Building Institute", role: "Technology & Marketing Partner", note: "Ten-year engagement across IWBI's growth from 10 to 130 people; at peak ran a 30-person team inside the relationship.", url: "https://wellcertified.com" },
    { client: "U.S. Green Building Council", role: "Community Development Manager", note: "Built a national community development program from the ground up.", url: "https://usgbc.org" },
  ],
  contact: {
    email: "shane.gring@certainly.coop",
    linkedin: "https://linkedin.com/in/shanegring",
    website: SITE,
    inquiry_form: `${SITE}/contact`,
  },
};

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export class ShaneGringMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "shanegring",
    version: "1.0.0",
  });

  async init() {
    this.server.registerTool(
      "get_operating_path",
      {
        title: "Working with Shane Gring",
        description:
          "Shane Gring's eight offers, grouped by what the buyer wants: find out what's wrong (Scan, free; Read, $1,500), have it done for you (Partner from $950/month; Map $10,000; Site $30,000-$75,000; Seat $10,000/month), or learn to do it yourself (Install $2,500; Session $250). " +
          "Returns every offer with price, timeline, what it produces, and how it credits into the next, plus a map of the offer names retired in July 2026. Every price is public and no discovery call is needed. " +
          "The tool name predates the rename and is kept so existing connectors keep working.",
        inputSchema: {},
      },
      async () => textResult(OPERATING_PATH)
    );

    this.server.registerTool(
      "about_shane",
      {
        title: "About Shane Gring",
        description:
          "Who Shane is, how he works, the signs a business is founder-dependent enough to need him, selected client work, and how to reach him.",
        inputSchema: {},
      },
      async () => textResult(ABOUT)
    );

    this.server.registerTool(
      "run_site_scan",
      {
        title: "Site Readiness Scan (free)",
        description:
          "Run Shane's free Site Readiness Scan on any public website. Returns a scored read across four lenses: can AI read it, can it drive its own SEO and content, " +
          "could it be a surface you build on, and the opportunity. Takes about 30 seconds. The email receives a copy of the result — use the real email of the person asking. " +
          "Rate limited; if it reports capacity, try again later or use the form at " + SITE + "/scan.",
        inputSchema: {
          url: z.string().describe("The website to scan, e.g. example.com or https://example.com"),
          email: z.string().email().describe("Where to send a copy of the scan result"),
        },
      },
      async ({ url, email }) => {
        const res = await fetch(`${SITE}/api/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, email, source: "mcp" }),
        });
        const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok || !body || body.error) {
          const msg = (body && (body.error as string)) || `Scan failed (${res.status}). Try again in a moment.`;
          return { content: [{ type: "text" as const, text: msg }], isError: true };
        }
        return textResult({
          ...body,
          next_step:
            "This is the free machine version of the Read. The Read ($1,500) is Shane doing this by hand: a 30–40 minute recorded walkthrough plus a findings memo, crediting in full toward the Map. " +
            SITE + "/read",
        });
      }
    );

    this.server.resource("llms-txt", `${SITE}/llms.txt`, async (uri) => {
      const res = await fetch(`${SITE}/llms.txt`);
      const text = res.ok ? await res.text() : "llms.txt is unavailable right now.";
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text }] };
    });
  }
}

const LANDING = `shanegring.com MCP server

This is a Model Context Protocol server for Shane Gring — fractional COO
for founder-dependent businesses.

Endpoint:  https://mcp.shanegring.com/mcp  (streamable HTTP, no auth)

Tools:
  get_operating_path  All eight offers, public prices, how they credit
  about_shane         Who Shane is, selected work, contact
  run_site_scan       Free scored read of any site's AI readiness

Add it to Claude: Settings → Connectors → Add custom connector,
or in Claude Code:  claude mcp add --transport http shanegring https://mcp.shanegring.com/mcp

The human version lives at https://shanegring.com
`;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      // A human clicking the link in a browser gets the explainer;
      // MCP clients GET with Accept: text/event-stream and pass through.
      const accept = request.headers.get("Accept") || "";
      if (request.method === "GET" && !accept.includes("text/event-stream")) {
        return new Response(LANDING, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return ShaneGringMCP.serve("/mcp", { binding: "SHANE_MCP" }).fetch(request, env, ctx);
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(LANDING, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Not found. The MCP endpoint is /mcp.", { status: 404 });
  },
};
