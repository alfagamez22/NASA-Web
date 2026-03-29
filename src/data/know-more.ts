/**
 * Know-More-About content items.
 *
 * Each entry in KNOW_MORE_ITEMS becomes a card on the /know-more page.
 * To add a new item, just add an object to the array – the component
 * picks it up automatically.
 *
 * Fields
 *  slug        – unique identifier (used as React key)
 *  title       – heading shown on the card
 *  subtitle    – optional smaller text below the heading (e.g. author)
 *  description – optional paragraph text
 *  colSpan     – 1 (default) or 2 to span the full grid width
 *  links       – array of external hyperlinks { label, url }
 *  embedUrl    – optional Google Slides / Docs / Sheets / Forms publish URL
 *               (must be a /pub?... or /embed URL for iframe to work)
 *  buttonLabel – label for the primary CTA button (shown only when no embed)
 *  buttonUrl   – URL the CTA button points to
 */

export interface KnowMoreLink {
  label: string;
  url: string;
}

export interface KnowMoreItem {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  colSpan?: 1 | 2;
  links?: KnowMoreLink[];
  embedUrl?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export const KNOW_MORE_ITEMS: KnowMoreItem[] = [
  {
    slug: "ran-functions-and-limitations",
    title: "RAN FUNCTIONS AND LIMITATIONS",
    subtitle: "By Paulinne Clairre Borlagdan",
    // Example: replace the embedUrl with a real published Google Slides link
    embedUrl:
      "https://docs.google.com/presentation/d/e/2PACX-1vExample/embed?start=false&loop=false&delayms=3000",
    buttonLabel: "READ DOCUMENT",
    buttonUrl: "#",
  },
  {
    slug: "integration-process",
    title: "INTEGRATION PROCESS",
    links: [
      {
        label: "Google Form",
        url: "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform",
      },
      { label: "Google Slides", url: "#" },
      { label: "Request Logs", url: "#" },
    ],
  },
  {
    slug: "icd-quality-ticket-issuance",
    title: "ICD QUALITY TICKET ISSUANCE",
    description:
      "Standard operating procedures for quality assurance and ticket management.",
    colSpan: 2,
    buttonLabel: "ACCESS GUIDELINES",
    buttonUrl: "#",
  },
];
