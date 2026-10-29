import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MonthlyReport } from "./report-data";

/**
 * Month-end PDF.
 *
 * Drawn entirely as vectors on the app's own near-black canvas so the export
 * looks like the product rather than a spreadsheet dump. Nothing is
 * rasterised, so text stays selectable and the file stays small.
 *
 * Note on currency: the built-in PDF fonts are WinAnsi-encoded and have no
 * rupee glyph, so amounts are printed with the ISO code ("INR 12,450.00")
 * rather than a symbol. That is standard practice in financial statements and
 * avoids embedding a megabyte of font data for one character.
 */

const PAGE = { w: 595.28, h: 841.89 };
const M = 46; // page margin
const CONTENT_W = PAGE.w - M * 2;

const INK = {
  bg: [10, 10, 10] as const,
  white: [255, 255, 255] as const,
  text: [244, 244, 244] as const,
  muted: [166, 166, 166] as const,
  faint: [132, 132, 132] as const,
  line: [58, 58, 58] as const,
  lineSoft: [38, 38, 38] as const,
  well: [22, 22, 22] as const,
  track: [48, 48, 48] as const,
};

/** Category colours from the app, converted to RGB for the PDF. */
const CATEGORY_RGB: Record<string, [number, number, number]> = {
  Food: [247, 148, 46],
  Transport: [51, 188, 224],
  Housing: [92, 137, 240],
  Entertainment: [187, 112, 232],
  Shopping: [226, 79, 143],
  Health: [59, 214, 122],
  Bills: [64, 140, 229],
  Other: [128, 128, 128],
};

const GOAL_RGB: Record<string, [number, number, number]> = {
  health: [57, 211, 83],
  finance: [255, 184, 0],
  personal: [155, 155, 155],
};

type RGB = readonly [number, number, number];

/** autoTable's Color type needs a fixed-length tuple, not number[]. */
const rgb = (c: RGB): [number, number, number] => [c[0], c[1], c[2]];

export interface PdfOptions {
  report: MonthlyReport;
  currency: "INR" | "USD";
  userName: string;
}

/* ------------------------------------------------------------------ */
/* Text safety                                                         */
/* ------------------------------------------------------------------ */

/*
 * Substitutions applied before anything reaches the PDF. Built from character
 * codes so the source file stays pure ASCII - a literal non-breaking space
 * here would be invisible to a reader and impossible to review.
 */
const ch = (...codes: number[]) => String.fromCharCode(...codes);
const cls = (...codes: number[]) => new RegExp("[" + ch(...codes) + "]", "g");

const SMART_QUOTES = cls(0x2018, 0x2019, 0x201b);
const SMART_DOUBLES = cls(0x201c, 0x201d);
const LONG_DASHES = cls(0x2013, 0x2014);
const ELLIPSIS = new RegExp(ch(0x2026), "g");
const ODD_SPACES = cls(0x00a0, 0x202f, 0x2009, 0x200a);
const BULLET = new RegExp(ch(0x2022), "g");
/** The core PDF fonts are WinAnsi-encoded; anything outside Latin-1 is dropped. */
const NON_LATIN1 = new RegExp("[^" + ch(0x20) + "-" + ch(0x7e) + ch(0xa1) + "-" + ch(0xff) + "]", "g");

/**
 * The core PDF fonts cover Latin-1 only. Anything outside it (emoji, CJK,
 * smart punctuation) would render as noise, so it is folded down or dropped.
 */
function safe(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(SMART_QUOTES, "'")
    .replace(SMART_DOUBLES, '"')
    .replace(LONG_DASHES, "-")
    .replace(ELLIPSIS, "...")
    .replace(ODD_SPACES, " ")
    .replace(BULLET, "-")
    .replace(NON_LATIN1, "")
    .trim();
}

function truncate(s: string, max: number): string {
  const clean = safe(s);
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

class ReportCanvas {
  doc: jsPDF;
  y = 0;
  pageIndex = 0;
  private fmt: Intl.NumberFormat;
  private code: string;

  constructor(private opts: PdfOptions) {
    this.doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
    this.code = opts.currency;
    this.fmt = new Intl.NumberFormat(opts.currency === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  money(n: number, decimals = 0): string {
    const formatted = new Intl.NumberFormat(this.code === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(n));
    return `${n < 0 ? "-" : ""}${this.code} ${formatted}`;
  }

  compact(n: number): string {
    return this.fmt.format(Math.round(n));
  }

  /* --- low level ------------------------------------------------- */

  fill(c: RGB) { this.doc.setFillColor(c[0], c[1], c[2]); return this; }
  stroke(c: RGB) { this.doc.setDrawColor(c[0], c[1], c[2]); return this; }
  ink(c: RGB) { this.doc.setTextColor(c[0], c[1], c[2]); return this; }

  alpha(value: number, draw: () => void) {
    const doc = this.doc as unknown as { GState: new (o: { opacity: number }) => unknown; setGState: (g: unknown) => void };
    doc.setGState(new doc.GState({ opacity: value }));
    draw();
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  font(family: "sans" | "mono", weight: "normal" | "bold", size: number) {
    this.doc.setFont(family === "mono" ? "courier" : "helvetica", weight);
    this.doc.setFontSize(size);
    return this;
  }

  /** Uppercase, letterspaced label — the app's `.eyebrow`. */
  /**
   * Bracketed, letterspaced label - the app's `.hud-label`.
   *
   * The brackets are drawn dimmer than the text, as they are in the UI, so
   * they read as instrument chrome rather than punctuation.
   */
  eyebrow(text: string, x: number, y: number, color: RGB = INK.faint) {
    const label = safe(text).toUpperCase();
    this.font("mono", "bold", 7);

    this.ink(INK.line);
    this.doc.text("[", x, y);
    const open = this.doc.getTextWidth("[ ");

    this.ink(color);
    this.doc.text(label, x + open, y, { charSpace: 1.6 });
    const body = this.doc.getTextWidth(label) + label.length * 1.6;

    this.ink(INK.line);
    this.doc.text("]", x + open + body + 2, y);
    return this;
  }

  /** Instrument bracket corners, as on the app's cards. */
  brackets(x: number, y: number, w: number, h: number, len = 7) {
    this.alpha(0.55, () => {
      this.stroke(INK.white);
      this.doc.setLineWidth(0.7);
      // Top-left
      this.doc.line(x, y, x + len, y);
      this.doc.line(x, y, x, y + len);
      // Bottom-right
      this.doc.line(x + w - len, y + h, x + w, y + h);
      this.doc.line(x + w, y + h - len, x + w, y + h);
    });
    return this;
  }

  /** Fine measurement ticks, the print version of `.tick-rail`. */
  tickRail(x: number, y: number, w: number, step = 8) {
    this.alpha(0.3, () => {
      this.stroke(INK.white);
      this.doc.setLineWidth(0.5);
      for (let i = 0; i <= w; i += step) {
        const tall = i % (step * 4) === 0;
        this.doc.line(x + i, y, x + i, y + (tall ? 4 : 2));
      }
    });
    return this;
  }

  /* --- page chrome ----------------------------------------------- */

  /** Paints the app's canvas onto the current page. */
  paintBackground() {
    this.fill(INK.bg).doc.rect(0, 0, PAGE.w, PAGE.h, "F");

    // The app's 40pt background grid, verticals only. Horizontal rules landed
    // on text baselines and read as strikethroughs at every zoom level; the
    // column grid alone still carries the look and leaves copy clean.
    this.alpha(0.045, () => {
      this.stroke(INK.white);
      this.doc.setLineWidth(0.4);
      for (let x = 40; x < PAGE.w; x += 40) this.doc.line(x, 0, x, PAGE.h);
    });
    return this;
  }

  newPage(withChrome = true) {
    if (this.pageIndex > 0) this.doc.addPage();
    this.pageIndex++;

    this.paintBackground();
    if (withChrome) this.chrome();
    this.y = withChrome ? 96 : M;
    return this;
  }

  chrome() {
    const { report } = this.opts;

    this.font("sans", "bold", 11).ink(INK.white);
    this.doc.text("3am", M, 52);

    this.font("mono", "normal", 7).ink(INK.faint);
    this.doc.text(
      safe(`${report.monthLabel.toUpperCase()}  /  MONTHLY REPORT`),
      PAGE.w - M,
      52,
      { align: "right", charSpace: 1.2 },
    );

    this.alpha(0.5, () => {
      this.stroke(INK.line);
      this.doc.setLineWidth(0.6);
      this.doc.line(M, 64, PAGE.w - M, 64);
    });

    this.brackets(M - 10, 34, CONTENT_W + 20, PAGE.h - 34 - 44, 10);
  }

  footer() {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      if (i === 1) continue; // the cover carries its own sign-off

      this.alpha(0.5, () => {
        this.stroke(INK.line);
        this.doc.setLineWidth(0.6);
        this.doc.line(M, PAGE.h - 52, PAGE.w - M, PAGE.h - 52);
      });

      this.font("mono", "normal", 7).ink(INK.faint);
      this.doc.text(safe(this.opts.userName), M, PAGE.h - 36);
      this.doc.text(`${i} / ${total}`, PAGE.w - M, PAGE.h - 36, { align: "right" });
    }
  }

  /** Reserve vertical space, starting a fresh page when it will not fit. */
  need(height: number) {
    if (this.y + height > PAGE.h - 74) this.newPage();
    return this;
  }

  /* --- composition ------------------------------------------------ */

  sectionTitle(eyebrow: string, title: string) {
    this.need(80);
    this.eyebrow(eyebrow, M, this.y);
    this.y += 20;
    this.font("sans", "bold", 21).ink(INK.text);
    this.doc.text(safe(title), M, this.y);
    this.y += 12;
    this.alpha(0.6, () => {
      this.stroke(INK.line);
      this.doc.setLineWidth(0.6);
      this.doc.line(M, this.y, PAGE.w - M, this.y);
    });
    this.tickRail(M, this.y + 1, CONTENT_W);
    this.y += 26;
    return this;
  }

  /** Inset panel matching `.surface-well`. */
  well(x: number, y: number, w: number, h: number) {
    this.fill(INK.well).doc.rect(x, y, w, h, "F");
    this.alpha(0.35, () => {
      this.stroke(INK.line);
      this.doc.setLineWidth(0.6);
      this.doc.rect(x, y, w, h, "S");
    });
    // Top-lit hairline, the print equivalent of the card's lit border.
    this.alpha(0.25, () => {
      this.stroke(INK.white);
      this.doc.setLineWidth(0.6);
      this.doc.line(x, y, x + w, y);
    });
    this.brackets(x, y, w, h, 6);
    return this;
  }

  /** A row of labelled figures. */
  statRow(stats: Array<{ label: string; value: string; sub?: string; accent?: RGB }>, height = 62) {
    this.need(height + 12);
    const gap = 10;
    const w = (CONTENT_W - gap * (stats.length - 1)) / stats.length;

    stats.forEach((stat, i) => {
      const x = M + i * (w + gap);
      this.well(x, this.y, w, height);

      this.eyebrow(stat.label, x + 12, this.y + 18);

      this.font("sans", "bold", stat.value.length > 13 ? 12 : stat.value.length > 9 ? 14 : 17);
      this.ink(stat.accent ?? INK.text);
      this.doc.text(truncate(stat.value, 22), x + 12, this.y + 40);

      if (stat.sub) {
        this.font("sans", "normal", 7.5).ink(INK.faint);
        this.doc.text(truncate(stat.sub, 34), x + 12, this.y + 53);
      }
    });

    this.y += height + 16;
    return this;
  }

  /** Vertical bar chart with a baseline and sparse labels. */
  barChart(
    data: Array<{ label: string; value: number }>,
    height: number,
    opts: { color?: RGB; labelEvery?: number; valueFormatter?: (n: number) => string } = {},
  ) {
    const { color = INK.white, labelEvery = 1, valueFormatter } = opts;
    this.need(height + 42);

    const top = this.y;
    const baseline = top + height;
    const max = Math.max(...data.map((d) => d.value), 1);

    // Gridlines at 0 / 50 / 100% of max.
    this.alpha(0.22, () => {
      this.stroke(INK.line);
      this.doc.setLineWidth(0.5);
      [0, 0.5, 1].forEach((t) => {
        const y = baseline - height * t;
        this.doc.line(M, y, PAGE.w - M, y);
      });
    });

    const slot = CONTENT_W / data.length;
    const barW = Math.max(Math.min(slot * 0.62, 18), 1.5);

    data.forEach((d, i) => {
      const x = M + i * slot + (slot - barW) / 2;
      const h = d.value > 0 ? Math.max((d.value / max) * height, 1.2) : 0;
      if (h > 0) {
        this.fill(color).doc.rect(x, baseline - h, barW, h, "F");
      } else {
        this.alpha(0.3, () => {
          this.fill(INK.line).doc.rect(x, baseline - 1, barW, 1, "F");
        });
      }
    });

    // Axis
    this.alpha(0.6, () => {
      this.stroke(INK.line);
      this.doc.setLineWidth(0.6);
      this.doc.line(M, baseline, PAGE.w - M, baseline);
    });

    this.font("mono", "normal", 6).ink(INK.faint);
    data.forEach((d, i) => {
      if (i % labelEvery !== 0) return;
      const x = M + i * slot + slot / 2;
      this.doc.text(safe(d.label), x, baseline + 12, { align: "center" });
    });

    // Peak callout
    if (valueFormatter) {
      const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
      if (peak && peak.value > 0) {
        this.font("mono", "normal", 6.5).ink(INK.muted);
        this.doc.text(`PEAK ${safe(valueFormatter(peak.value))}`, PAGE.w - M, top - 6, { align: "right" });
      }
    }

    this.y = baseline + 26;
    return this;
  }

  /**
   * One stroked arc, emitted as a single connected path.
   *
   * Drawing a wedge as a fan of triangles left a visible radial seam every few
   * degrees. Stroking a polyline at the ring's mid-radius with a round line
   * join produces a clean band instead.
   */
  private arc(
    cx: number,
    cy: number,
    r: number,
    from: number,
    to: number,
    width: number,
    color: RGB,
    cap: "butt" | "round" = "butt",
  ) {
    if (to - from <= 0.0005) return;

    const steps = Math.max(4, Math.ceil(((to - from) / (Math.PI * 2)) * 240));
    const step = (to - from) / steps;

    const startX = cx + Math.cos(from) * r;
    const startY = cy + Math.sin(from) * r;

    const deltas: Array<[number, number]> = [];
    let prevX = startX;
    let prevY = startY;
    for (let i = 1; i <= steps; i++) {
      const a = from + step * i;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      deltas.push([x - prevX, y - prevY]);
      prevX = x;
      prevY = y;
    }

    this.stroke(color);
    this.doc.setLineWidth(width);
    this.doc.setLineJoin("round");
    this.doc.setLineCap(cap);
    this.doc.lines(deltas, startX, startY, [1, 1], "S", false);
    this.doc.setLineCap("butt");
    this.doc.setLineJoin("miter");
  }

  /** Ring chart. Slices are separated by a hairline angular gap. */
  donut(
    cx: number,
    cy: number,
    radius: number,
    thickness: number,
    slices: Array<{ value: number; color: RGB }>,
  ) {
    const mid = radius - thickness / 2;
    const total = slices.reduce((s, x) => s + x.value, 0);

    if (total <= 0) {
      this.arc(cx, cy, mid, 0, Math.PI * 2 - 0.001, thickness, INK.track);
      return this;
    }

    // Gap shrinks for slivers so a 1% slice does not disappear into it.
    const GAP = 0.022;
    let angle = -Math.PI / 2; // 12 o'clock

    for (const slice of slices) {
      if (slice.value <= 0) continue;
      const sweep = (slice.value / total) * Math.PI * 2;
      const gap = Math.min(GAP, sweep * 0.25);
      this.arc(cx, cy, mid, angle + gap / 2, angle + sweep - gap / 2, thickness, slice.color);
      angle += sweep;
    }
    return this;
  }

  /** Progress arc used for the composite score. */
  scoreRing(cx: number, cy: number, radius: number, pct: number, thickness = 9) {
    this.arc(cx, cy, radius, 0, Math.PI * 2 - 0.001, thickness, INK.track);

    const clamped = Math.min(Math.max(pct, 0), 100);
    if (clamped <= 0) return this;

    const sweep = Math.min((clamped / 100) * Math.PI * 2, Math.PI * 2 - 0.001);
    this.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + sweep, thickness, INK.white, "round");
    return this;
  }

  /** Labelled horizontal bar, optionally with a budget marker. */
  progressRow(
    label: string,
    valueText: string,
    ratio: number,
    color: RGB,
    opts: { marker?: number; note?: string } = {},
  ) {
    const rowH = opts.note ? 40 : 26;
    this.need(rowH + 4);

    const barY = this.y + 5;
    const labelW = 100;
    const valueW = 130;
    const barX = M + labelW;
    const barW = CONTENT_W - labelW - valueW;

    this.font("sans", "normal", 9).ink(INK.text);
    this.doc.text(truncate(label, 18), M, this.y + 10);

    // Drawn solid: at 0.5 alpha the track was invisible against the page, so
    // a part-filled bar read exactly like a full one.
    this.fill(INK.track).doc.rect(barX, barY, barW, 6, "F");

    const clamped = Math.min(Math.max(ratio, 0), 1);
    if (clamped > 0) {
      this.fill(color).doc.rect(barX, barY, Math.max(barW * clamped, 1.5), 6, "F");
    }

    if (opts.marker !== undefined && opts.marker > 0 && opts.marker <= 1) {
      this.stroke(INK.white);
      this.doc.setLineWidth(0.8);
      const mx = barX + barW * opts.marker;
      this.doc.line(mx, barY - 3, mx, barY + 9);
    }

    this.font("mono", "normal", 8).ink(INK.text);
    this.doc.text(safe(valueText), PAGE.w - M, this.y + 10, { align: "right" });

    if (opts.note) {
      this.font("sans", "normal", 7.5).ink(INK.muted);
      this.doc.text(truncate(opts.note, 62), barX, barY + 20);
    }

    this.y += rowH;
    return this;
  }

  /**
   * Centres text, shrinking it until it fits `maxWidth`.
   *
   * The donut's centre label is a currency string whose length depends on the
   * amount, so a fixed size overflowed the hole and crossed the ring.
   */
  fitCenteredText(
    text: string,
    cx: number,
    y: number,
    maxWidth: number,
    startSize: number,
    weight: "normal" | "bold" = "bold",
    minSize = 7,
  ) {
    const clean = safe(text);
    let size = startSize;
    this.font("sans", weight, size);
    while (size > minSize && this.doc.getTextWidth(clean) > maxWidth) {
      size -= 0.5;
      this.font("sans", weight, size);
    }
    this.doc.text(clean, cx, y, { align: "center" });
    return size;
  }

  paragraph(text: string, size = 9, color: RGB = INK.muted, leading = 13) {
    const lines = this.doc.splitTextToSize(safe(text), CONTENT_W) as string[];
    this.need(lines.length * leading + 6);
    this.font("sans", "normal", size).ink(color);
    lines.forEach((line) => {
      this.doc.text(line, M, this.y);
      this.y += leading;
    });
    return this;
  }
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function drawCover(c: ReportCanvas, report: MonthlyReport, userName: string) {
  c.newPage(false);
  const doc = c.doc;

  // Masthead
  c.font("sans", "bold", 13).ink(INK.white);
  doc.text("3am", M, 64);
  c.font("mono", "bold", 7).ink(INK.faint);
  doc.text("MONTHLY REPORT", PAGE.w - M, 64, { align: "right", charSpace: 1.6 });

  c.alpha(0.6, () => {
    c.stroke(INK.line);
    doc.setLineWidth(0.6);
    doc.line(M, 78, PAGE.w - M, 78);
  });

  // Title block
  const [year, month] = report.monthKey.split("-");
  const monthName = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("en-US", { month: "long" })
    .toUpperCase();

  c.font("sans", "bold", 62).ink(INK.text);
  doc.text(monthName, M, 214);

  c.font("sans", "normal", 62).ink(INK.faint);
  doc.text(year, M, 272);

  c.font("sans", "normal", 10).ink(INK.muted);
  doc.text(safe(`Prepared for ${userName}`), M, 310);

  c.font("mono", "normal", 7.5).ink(INK.muted);
  doc.text(
    safe(
      report.isPartial
        ? `PARTIAL - ${report.daysElapsed} OF ${report.daysInMonth} DAYS  /  GENERATED ${report.generatedAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}`
        : `${report.daysInMonth} DAYS  /  GENERATED ${report.generatedAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}`,
    ),
    M,
    336,
    { charSpace: 0.9 },
  );

  // Score ring
  const cx = PAGE.w - M - 76;
  const cy = 232;
  c.scoreRing(cx, cy, 58, report.score, 10);
  c.font("sans", "bold", 30).ink(INK.text);
  doc.text(String(report.score), cx, cy + 6, { align: "center" });
  c.font("mono", "normal", 6.5).ink(INK.faint);
  doc.text("MONTH SCORE", cx, cy + 22, { align: "center", charSpace: 1.2 });

  // Headline figures
  c.y = 372;
  c.statRow(
    [
      { label: "Total spent", value: c.money(report.spending.total) },
      {
        label: "vs last month",
        value:
          report.spending.changePct === null
            ? "--"
            : `${report.spending.changePct > 0 ? "+" : ""}${report.spending.changePct.toFixed(0)}%`,
        sub: report.spending.previousTotal > 0 ? `was ${c.money(report.spending.previousTotal)}` : "no prior data",
      },
      { label: "Transactions", value: String(report.spending.transactions) },
      { label: "Daily average", value: c.money(report.spending.dailyAverage) },
    ],
    66,
  );

  // The month's plan, when one was set.
  if (report.spending.salary > 0 || report.spending.plannedBudget > 0) {
    const saved = report.spending.saved;
    c.statRow(
      [
        { label: "Salary", value: c.money(report.spending.salary) },
        {
          label: "Budgeted",
          value: report.spending.plannedBudget > 0 ? c.money(report.spending.plannedBudget) : "--",
        },
        {
          label: saved < 0 ? "Overspent" : "Kept",
          value: c.money(Math.abs(saved)),
          sub: report.spending.salary > 0
            ? `${Math.round(report.spending.savingsRate * 100)}% of salary`
            : undefined,
        },
        {
          label: "Vs plan",
          value: report.spending.plannedBudget > 0
            ? c.money(Math.abs(report.spending.total - report.spending.plannedBudget))
            : "--",
          sub: report.spending.plannedBudget > 0
            ? report.spending.total > report.spending.plannedBudget ? "over budget" : "under budget"
            : undefined,
        },
      ],
      66,
    );
  }

  // Score breakdown strip
  c.y += 4;
  c.eyebrow("Score breakdown", M, c.y);
  c.y += 18;
  for (const part of report.scoreBreakdown) {
    c.progressRow(part.label, `${part.value} / 100`, part.value / 100, INK.white, { note: part.detail });
  }

  // Headline observation, set as a pull quote in whatever space is left.
  // Anchored to the flow rather than a fixed offset: the plan row made the
  // breakdown taller, and a fixed position printed straight through it.
  const headline = report.insights[0];
  const quoteTop = Math.max(c.y + 18, PAGE.h - 132);
  const roomForQuote = quoteTop < PAGE.h - 96;
  if (headline && roomForQuote) {
    const quoteY = quoteTop;
    c.fill(INK.white);
    doc.rect(M, quoteY - 10, 2, 26, "F");

    c.font("sans", "normal", 12).ink(INK.text);
    const lines = doc.splitTextToSize(safe(headline), CONTENT_W - 22) as string[];
    lines.slice(0, 2).forEach((line, i) => doc.text(line, M + 16, quoteY + i * 16));
  }

  // Sign-off
  c.alpha(0.6, () => {
    c.stroke(INK.line);
    doc.setLineWidth(0.6);
    doc.line(M, PAGE.h - 72, PAGE.w - M, PAGE.h - 72);
  });
  c.font("mono", "normal", 6.5).ink(INK.faint);
  doc.text("3AM  /  SPEND CONSCIOUSLY, INVEST PATIENTLY", M, PAGE.h - 54, { charSpace: 1.2 });
}

function drawSpending(c: ReportCanvas, report: MonthlyReport) {
  const s = report.spending;
  c.newPage();
  c.sectionTitle("Section 01", "Spending");

  c.statRow([
    { label: "Total", value: c.money(s.total) },
    { label: "Budgeted", value: s.totalBudget > 0 ? c.money(s.totalBudget) : "Not set" },
    { label: "Remaining", value: s.income > 0 || s.totalBudget > 0 ? c.money(s.remaining) : "--" },
    {
      label: report.isPartial ? "Projected" : "Busiest day",
      value: report.isPartial ? c.money(s.projectedTotal) : s.busiestDay ? c.money(s.busiestDay.total) : "--",
      sub: report.isPartial ? "at current pace" : s.busiestDay?.label,
    },
  ]);

  // Daily pattern
  c.eyebrow("Daily pattern", M, c.y);
  c.y += 16;
  c.barChart(
    s.days.map((d) => ({ label: String(Number(d.date.slice(-2))), value: d.total })),
    96,
    { labelEvery: s.days.length > 20 ? 3 : 2, valueFormatter: (n) => c.money(n) },
  );

  c.font("sans", "normal", 8).ink(INK.faint);
  c.doc.text(
    safe(`${s.quietDays} no-spend days  ·  ${c.money(s.dailyAverage)} average per day`),
    M,
    c.y,
  );
  c.y += 26;

  // Category split
  c.need(190);
  c.eyebrow("Where it went", M, c.y);
  c.y += 18;

  const donutCx = M + 84;
  const donutCy = c.y + 74;
  const donutR = 70;
  const donutThickness = 19;
  const active = s.categories.filter((cat) => cat.total > 0);

  c.donut(
    donutCx,
    donutCy,
    donutR,
    donutThickness,
    active.map((cat) => ({ value: cat.total, color: CATEGORY_RGB[cat.category] ?? INK.muted })),
  );

  c.ink(INK.text);
  c.fitCenteredText(c.money(s.total), donutCx, donutCy + 2, (donutR - donutThickness) * 2 - 12, 14);
  c.font("mono", "normal", 6).ink(INK.faint);
  c.doc.text("TOTAL", donutCx, donutCy + 15, { align: "center", charSpace: 1.2 });

  // Legend to the right of the donut
  const legendX = M + 186;
  let legendY = c.y + 14;
  if (active.length === 0) {
    c.font("sans", "normal", 9).ink(INK.faint);
    c.doc.text("No expenses recorded this month.", legendX, legendY + 60);
  }
  for (const cat of active.slice(0, 8)) {
    const color = CATEGORY_RGB[cat.category] ?? INK.muted;
    c.fill(color).doc.rect(legendX, legendY - 6, 7, 7, "F");

    c.font("sans", "normal", 9).ink(INK.text);
    c.doc.text(safe(cat.category), legendX + 14, legendY);

    c.font("mono", "normal", 8).ink(INK.muted);
    c.doc.text(`${(cat.share * 100).toFixed(0)}%`, legendX + 118, legendY, { align: "right" });

    c.font("mono", "normal", 8).ink(INK.text);
    c.doc.text(c.money(cat.total), PAGE.w - M, legendY, { align: "right" });

    legendY += 17;
  }

  c.y = Math.max(donutCy + 84, legendY + 12);

  // Budget adherence
  const budgeted = s.categories.filter((cat) => cat.budget > 0);
  if (budgeted.length > 0) {
    c.need(60);
    c.eyebrow("Budget adherence", M, c.y);
    c.y += 18;
    for (const cat of budgeted) {
      const ratio = cat.budgetUsed ?? 0;
      const over = ratio > 1;
      c.progressRow(
        cat.category,
        `${c.money(cat.total)} / ${c.money(cat.budget)}`,
        Math.min(ratio, 1),
        over ? [226, 79, 143] : (CATEGORY_RGB[cat.category] ?? INK.white),
        { note: over ? `Over by ${c.money(cat.total - cat.budget)}` : `${Math.round(ratio * 100)}% used` },
      );
    }
  }
}

function drawTransactions(c: ReportCanvas, report: MonthlyReport) {
  const s = report.spending;
  if (s.ledger.length === 0) return;

  c.newPage();
  c.sectionTitle("Section 02", "Transactions");

  if (s.topExpenses.length > 0) {
    c.eyebrow("Largest this month", M, c.y);
    c.y += 14;

    autoTable(c.doc, {
      startY: c.y,
      margin: { left: M, right: M },
      head: [["Date", "Category", "Note", "Amount"]],
      body: s.topExpenses.map((e) => [
        new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        safe(e.category),
        truncate(e.note || "-", 44),
        c.money(e.amount, 2),
      ]),
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: rgb(INK.text),
        fillColor: [14, 14, 14],
        cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
        lineColor: rgb(INK.lineSoft),
        lineWidth: { bottom: 0.5 },
      },
      alternateRowStyles: { fillColor: [20, 20, 20] },
      headStyles: {
        font: "courier",
        fontStyle: "bold",
        fontSize: 7,
        textColor: rgb(INK.muted),
        fillColor: [26, 26, 26],
        lineColor: rgb(INK.line),
        lineWidth: { bottom: 0.7 },
        cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
      },
      columnStyles: {
        0: { cellWidth: 58, font: "courier", fontSize: 7.5, textColor: rgb(INK.muted) },
        1: { cellWidth: 92 },
        2: { cellWidth: 196 },
        3: { halign: "right", font: "courier", fontSize: 8 },
      },
      // columnStyles do not reach the header row, so the Amount heading would
      // sit left of its own column.
      didParseCell: (data) => {
        if (data.section === "head" && data.column.index === 3) data.cell.styles.halign = "right";
      },
    });

    c.y = ((c.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? c.y) + 28;
  }

  c.need(70);
  c.eyebrow(`Full ledger  ·  ${s.ledger.length} entries`, M, c.y);
  c.y += 14;

  autoTable(c.doc, {
    startY: c.y,
    margin: { left: M, right: M, top: 84, bottom: 66 },
    head: [["Date", "Category", "Note", "Amount"]],
    body: s.ledger.map((e) => [
      new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      safe(e.category),
      truncate(e.note || "-", 44),
      c.money(e.amount, 2),
    ]),
    foot: [["", "", "TOTAL", c.money(s.total, 2)]],
    theme: "plain",
    // Repeated on every page it spans, so a long ledger always has headings.
    showHead: "everyPage",
    // ...but a running "TOTAL" mid-ledger would read as a subtotal.
    showFoot: "lastPage",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: rgb(INK.text),
      fillColor: [14, 14, 14],
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      lineColor: rgb(INK.lineSoft),
      lineWidth: { bottom: 0.5 },
    },
    headStyles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 7,
      textColor: rgb(INK.muted),
      fillColor: [26, 26, 26],
      lineColor: rgb(INK.line),
      lineWidth: { bottom: 0.7 },
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
    },
    footStyles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 8,
      textColor: rgb(INK.text),
      fillColor: [26, 26, 26],
      lineColor: rgb(INK.line),
      lineWidth: { top: 0.7 },
      halign: "right",
    },
    alternateRowStyles: { fillColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 54, font: "courier", fontSize: 7, textColor: rgb(INK.muted) },
      1: { cellWidth: 86 },
      2: { cellWidth: 200 },
      3: { halign: "right", font: "courier", fontSize: 7.5, textColor: rgb(INK.text) },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 3) data.cell.styles.halign = "right";
    },
    // autoTable adds its own pages, and those arrive as blank white sheets
    // with no header. Paint the canvas and masthead onto each one.
    willDrawPage: (data) => {
      if (data.pageNumber > 1) {
        c.paintBackground();
        c.chrome();
      }
    },
  });

  c.y = ((c.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? c.y) + 24;
}

function drawProgress(c: ReportCanvas, report: MonthlyReport) {
  c.newPage();
  c.sectionTitle("Section 03", "Progress");

  /* Sleep -------------------------------------------------------- */
  c.eyebrow("Rest", M, c.y);
  c.y += 16;

  const sl = report.sleep;
  c.statRow(
    [
      { label: "Nights logged", value: `${sl.nightsLogged}`, sub: `of ${report.daysElapsed} days` },
      { label: "Average", value: sl.nightsLogged ? `${sl.averageHours.toFixed(1)}h` : "--", sub: "target 8.0h" },
      { label: "Best / worst", value: sl.nightsLogged ? `${sl.bestHours.toFixed(1)} / ${sl.worstHours.toFixed(1)}h` : "--" },
      {
        label: sl.debtHours >= 0 ? "Sleep debt" : "Sleep surplus",
        value: sl.nightsLogged ? `${Math.abs(sl.debtHours).toFixed(1)}h` : "--",
        sub: `${sl.onTargetNights} nights on target`,
      },
    ],
    58,
  );

  if (sl.nightsLogged > 0) {
    c.progressRow("Consistency", `${Math.round(sl.consistency * 100)}%`, sl.consistency, INK.white, {
      note: "How steady your nights were, night to night",
    });
    if (sl.previousAverage !== null) {
      const delta = sl.averageHours - sl.previousAverage;
      c.font("sans", "normal", 8).ink(INK.faint);
      c.doc.text(
        safe(`Last month averaged ${sl.previousAverage.toFixed(1)}h (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}h change).`),
        M,
        c.y,
      );
      c.y += 18;
    }
  }
  c.y += 8;

  /* Movement ----------------------------------------------------- */
  c.need(104);
  c.eyebrow("Movement", M, c.y);
  c.y += 16;

  const w = report.workouts;
  c.statRow(
    [
      { label: "Sessions", value: `${w.sessions}` },
      { label: "Total time", value: `${w.totalMinutes}m`, sub: w.sessions ? `${Math.round(w.averageSessionMinutes)}m average` : undefined },
      { label: "Active days", value: `${w.activeDays}`, sub: `of ${report.daysElapsed} days` },
      { label: "Longest streak", value: `${w.longestStreak}d` },
    ],
    58,
  );

  if (w.byType.length > 0) {
    for (const t of w.byType) {
      c.progressRow(
        t.type,
        `${t.minutes}m`,
        w.totalMinutes > 0 ? t.minutes / w.totalMinutes : 0,
        INK.white,
        { note: `${t.sessions} ${t.sessions === 1 ? "session" : "sessions"}` },
      );
    }
  }
  c.y += 8;

  /* Focus -------------------------------------------------------- */
  c.need(104);
  c.eyebrow("Focus", M, c.y);
  c.y += 16;

  const t = report.tasks;
  c.statRow(
    [
      { label: "Created", value: `${t.created}` },
      { label: "Completed", value: `${t.completed}` },
      { label: "Completion", value: `${Math.round(t.completionRate * 100)}%` },
      {
        label: "Best day",
        value: t.mostProductiveDay ? `${t.mostProductiveDay.count}` : "--",
        sub: t.mostProductiveDay?.label,
      },
    ],
    58,
  );

  for (const row of t.byPriority) {
    if (row.created === 0 && row.completed === 0) continue;
    const color: RGB = row.priority === "P1" ? [255, 64, 96] : row.priority === "P2" ? [255, 149, 0] : [155, 155, 155];
    c.progressRow(
      `Priority ${row.priority}`,
      `${row.completed} / ${row.created}`,
      row.created > 0 ? row.completed / row.created : 0,
      color,
    );
  }
  c.y += 8;

  /* Objectives --------------------------------------------------- */
  c.need(104);
  c.eyebrow("Objectives", M, c.y);
  c.y += 16;

  const g = report.goals;
  c.statRow(
    [
      { label: "Closed this month", value: `${g.completedThisMonth}` },
      { label: "Still active", value: `${g.active}` },
      { label: "Past deadline", value: `${g.overdue}` },
      { label: "Average progress", value: `${Math.round(g.averageProgress)}%` },
    ],
    58,
  );

  for (const h of g.highlights) {
    c.progressRow(
      truncate(h.title, 20),
      h.completed ? "Done" : `${h.progress}%`,
      h.progress / 100,
      GOAL_RGB[h.category] ?? INK.white,
      { note: h.completed ? `${h.category} · completed` : `${h.category} · due ${h.deadline}` },
    );
  }
}

function drawInsights(c: ReportCanvas, report: MonthlyReport) {
  if (report.insights.length === 0) return;

  c.newPage();
  c.sectionTitle("Section 04", "What the month says");

  report.insights.forEach((line, i) => {
    c.need(34);
    c.font("mono", "bold", 8).ink(INK.faint);
    c.doc.text(String(i + 1).padStart(2, "0"), M, c.y + 1);

    const lines = c.doc.splitTextToSize(safe(line), CONTENT_W - 30) as string[];
    c.font("sans", "normal", 10).ink(INK.text);
    lines.forEach((l, li) => c.doc.text(l, M + 30, c.y + li * 14));
    c.y += lines.length * 14 + 12;
  });

  c.y += 14;
  c.alpha(0.6, () => {
    c.stroke(INK.line);
    c.doc.setLineWidth(0.6);
    c.doc.line(M, c.y, PAGE.w - M, c.y);
  });
  c.y += 22;

  c.eyebrow("Carry forward", M, c.y);
  c.y += 18;

  const suggestions: string[] = [];
  if (report.spending.overBudget.length > 0) {
    suggestions.push(`Revisit the ${report.spending.overBudget[0].category} budget, or the habit behind it.`);
  }
  if (report.sleep.nightsLogged < report.daysElapsed * 0.6) {
    suggestions.push("Log sleep more nights — the average only means something with a full picture.");
  } else if (report.sleep.debtHours > 6) {
    suggestions.push("Pull bedtime earlier by 30 minutes and watch the debt close on its own.");
  }
  if (report.workouts.activeDays < (report.daysElapsed / 7) * 3) {
    suggestions.push("Three active days a week is the floor worth defending next month.");
  }
  if (report.tasks.completionRate < 0.6 && report.tasks.created > 4) {
    suggestions.push("Fewer, larger tasks tend to close better than a long queue of small ones.");
  }
  if (report.goals.overdue > 0) {
    suggestions.push("Re-date or retire the overdue objectives so the list stays honest.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Nothing is off track. Keep the same shape next month.");
  }

  suggestions.forEach((line) => {
    c.need(24);
    c.font("sans", "normal", 9.5).ink(INK.muted);
    const lines = c.doc.splitTextToSize(safe(line), CONTENT_W - 18) as string[];
    c.fill(INK.white);
    c.doc.rect(M, c.y - 4, 3, 3, "F");
    lines.forEach((l, li) => c.doc.text(l, M + 14, c.y + li * 13));
    c.y += lines.length * 13 + 10;
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function buildReportPdf(opts: PdfOptions): jsPDF {
  const c = new ReportCanvas(opts);
  const { report } = opts;

  c.doc.setProperties({
    title: `3am — ${report.monthLabel} Report`,
    subject: "Monthly spending and progress report",
    author: "3am",
    creator: "3am",
  });

  drawCover(c, report, opts.userName);
  drawSpending(c, report);
  drawTransactions(c, report);
  drawProgress(c, report);
  drawInsights(c, report);
  c.footer();

  return c.doc;
}

export function reportFileName(report: MonthlyReport): string {
  return `3am-report-${report.monthKey}.pdf`;
}

export function downloadReportPdf(opts: PdfOptions) {
  buildReportPdf(opts).save(reportFileName(opts.report));
}

/** Blob URL for previewing without forcing a download. */
export function reportPdfUrl(opts: PdfOptions): string {
  return buildReportPdf(opts).output("bloburl") as unknown as string;
}
