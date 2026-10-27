// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { User, FileText, CheckCircle } = Icons;

const HEADING_STACK = "'Libre Franklin', 'Libre Franklin Semibold', 'Helvetica Neue', system-ui, sans-serif";
const BODY_STACK = "'Source Serif 4', 'Source Serif Pro', 'Iowan Old Style', Georgia, serif";

const HAIRLINE = "rgba(85, 87, 92, 0.22)";
const RULE_INK = "rgba(85, 87, 92, 0.16)";
const SHEET_TINT = "rgba(255, 255, 255, 0.58)";

const FACTS = [
  {
    id: "i-2-0-0",
    index: "01",
    icon: "User",
    title: "No account",
    lead: "Start writing straight away",
    body: "No sign-up, no login, no email address asked for. Open the notepad and the first keystroke is already a note.",
  },
  {
    id: "i-2-0-1",
    index: "02",
    icon: "FileText",
    title: "Stored on this device",
    lead: "Notes live in your browser only",
    body: "Every note is written to this browser's local storage as you type. Nothing travels over the network and nothing syncs to another machine.",
  },
  {
    id: "i-2-0-2",
    index: "03",
    icon: "CheckCircle",
    title: "Free to use",
    lead: "No payment, billing or subscription, ever",
    body: "Writing, searching, editing and deleting notes are all free. There is no plan to upgrade to and no card to add.",
  },
];

export default function Screen() {
  const navigate = useNavigate();
  const [opening, setOpening] = React.useState(false);
  const openingRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (openingRef.current) window.clearTimeout(openingRef.current);
    };
  }, []);

  const goToNotes = () => {
    if (opening) return;
    setOpening(true);
    openingRef.current = window.setTimeout(() => {
      navigate("notes");
    }, 260);
  };

  const UserIcon = Icons.User;
  const FileTextIcon = Icons.FileText;
  const CheckCircleIcon = Icons.CheckCircle;
  const AlertCircleIcon = Icons.AlertCircle;
  const ArrowLeftIcon = Icons.ArrowLeft;
  const iconFor = { User: UserIcon, FileText: FileTextIcon, CheckCircle: CheckCircleIcon };

  const ruledParagraph = {
    fontFamily: BODY_STACK,
    fontSize: "19px",
    lineHeight: "32px",
    color: brand.primaryColor,
    backgroundImage:
      "repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, " +
      RULE_INK +
      " 31px, " +
      RULE_INK +
      " 32px)",
  };

  return (
    <div
      className="w-full"
      style={{ backgroundColor: brand.backgroundColor, color: brand.primaryColor }}
    >
      <style>{`
        .np-focus:focus-visible {
          outline: 2px solid ${brand.accentColor};
          outline-offset: 3px;
          border-radius: ${brand.radius};
        }
        .np-rise {
          opacity: 0;
          transform: translateY(6px);
          animation: npRise 420ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        @keyframes npRise {
          to { opacity: 1; transform: translateY(0); }
        }
        .np-btn { transition: background-color 160ms ease, transform 120ms ease, opacity 160ms ease; }
        .np-btn:hover { opacity: 0.92; }
        .np-btn:active { transform: translateY(1px); }
        .np-card { transition: background-color 180ms ease, border-color 180ms ease; }
        .np-card:hover { background-color: rgba(255,255,255,0.86); border-color: rgba(85,87,92,0.34); }
        @media (prefers-reduced-motion: reduce) {
          .np-rise { animation: none; opacity: 1; transform: none; }
          .np-btn, .np-card { transition: none; }
          .np-btn:active { transform: none; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-10 sm:px-10 lg:px-14">
        {/* Row 1 — page title */}
        <header data-wf="b-0-0" className="np-rise">
          <p
            className="text-[12px] uppercase"
            style={{
              fontFamily: HEADING_STACK,
              letterSpacing: "0.14em",
              color: brand.neutralColor,
            }}
          >
            The notepad, plainly
          </p>
          <h1
            className="mt-3 text-[34px] leading-[1.15] sm:text-[40px]"
            style={{ fontFamily: HEADING_STACK, fontWeight: 600, letterSpacing: "-0.015em" }}
          >
            About &amp; Storage
          </h1>
          <div
            aria-hidden="true"
            className="mt-6 h-px w-full"
            style={{ backgroundColor: HAIRLINE }}
          />
        </header>

        {/* Row 2 — intro text on ruled stock */}
        <section data-wf="b-1-0" className="np-rise mt-8" style={{ animationDelay: "40ms" }}>
          <div className="flex gap-6 sm:gap-8">
            <div
              aria-hidden="true"
              className="hidden shrink-0 sm:block"
              style={{
                width: "2px",
                backgroundColor: brand.accentColor,
                opacity: 0.55,
              }}
            />
            <div className="max-w-[66ch]">
              <p style={ruledParagraph}>
                Your notes are saved only in this browser, on this device, using local browser
                storage. Nothing is sent to a server and nothing syncs between devices.
              </p>
              <p
                className="mt-5 text-[14px] leading-6"
                style={{ fontFamily: BODY_STACK, color: brand.neutralColor }}
              >
                There is no backend here — no database, no sign-in, no analytics call. The notepad is
                a single page that reads and writes your own browser&rsquo;s storage.
              </p>
            </div>
          </div>
        </section>

        {/* Row 3 — card grid */}
        <section data-wf="b-2-0" className="mt-12">
          <h2 className="sr-only">What that means in practice</h2>
          <ul className="grid grid-cols-1 gap-px overflow-hidden md:grid-cols-3"
              style={{ backgroundColor: HAIRLINE, border: `1px solid ${HAIRLINE}`, borderRadius: brand.radius }}>
            {FACTS.map((fact, i) => {
              const Icon = iconFor[fact.icon];
              return (
                <li
                  key={fact.id}
                  data-wf={fact.id}
                  className="np-card np-rise flex h-full flex-col p-6 sm:p-7"
                  style={{
                    backgroundColor: SHEET_TINT,
                    animationDelay: `${90 + i * 70}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[12px]"
                      style={{
                        fontFamily: HEADING_STACK,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "0.08em",
                        color: brand.accentColor,
                        fontWeight: 600,
                      }}
                    >
                      {fact.index}
                    </span>
                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                      style={{ color: brand.neutralColor }}
                    />
                  </div>
                  <h3
                    className="mt-4 text-[19px] leading-tight"
                    style={{ fontFamily: HEADING_STACK, fontWeight: 600 }}
                  >
                    {fact.title}
                  </h3>
                  <p
                    className="mt-2 text-[16px] leading-6"
                    style={{ fontFamily: BODY_STACK, color: brand.primaryColor }}
                  >
                    {fact.lead}
                  </p>
                  <p
                    className="mt-3 text-[14px] leading-6"
                    style={{ fontFamily: BODY_STACK, color: brand.neutralColor }}
                  >
                    {fact.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Row 4 — the caution */}
        <section data-wf="b-3-0" className="np-rise mt-12" style={{ animationDelay: "320ms" }}>
          <div
            className="flex max-w-[76ch] gap-4 p-6 sm:gap-5 sm:p-7"
            style={{
              border: `1px solid ${HAIRLINE}`,
              borderLeft: `2px solid ${brand.accentColor}`,
              borderRadius: brand.radius,
              backgroundColor: "rgba(255,255,255,0.34)",
            }}
          >
            <AlertCircleIcon
              aria-hidden="true"
              className="mt-1 h-5 w-5 shrink-0"
              style={{ color: brand.primaryColor }}
            />
            <div>
              <h2
                className="text-[15px]"
                style={{ fontFamily: HEADING_STACK, fontWeight: 600, letterSpacing: "0.01em" }}
              >
                Keep in mind: there is no backup
              </h2>
              <p
                className="mt-2 text-[17px] leading-[30px]"
                style={{ fontFamily: BODY_STACK }}
              >
                If you clear your browser data, or open the app in another browser or on another
                device, your notes will not be there. There is no backup and no cloud copy.
              </p>
              <p
                className="mt-3 text-[14px] leading-6"
                style={{ fontFamily: BODY_STACK, color: brand.neutralColor }}
              >
                Private browsing windows and &ldquo;clear cookies and site data&rdquo; both wipe
                local storage. If a note matters, paste a copy somewhere that does have a backup.
              </p>
            </div>
          </div>
        </section>

        {/* Row 5 — primary action */}
        <div data-wf="b-4-0" className="mt-12 grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <button
              type="button"
              onClick={goToNotes}
              aria-busy={opening ? "true" : "false"}
              className="np-focus np-btn inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-6 text-[15px]"
              style={{
                backgroundColor: brand.accentColor,
                color: "#ffffff",
                borderRadius: brand.radius,
                fontFamily: HEADING_STACK,
                fontWeight: 600,
                letterSpacing: "0.01em",
                cursor: opening ? "progress" : "pointer",
              }}
            >
              <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
              {opening ? "Opening your notes…" : "Back to my notes"}
            </button>
            <p
              className="mt-3 text-[13px] leading-5"
              style={{ fontFamily: BODY_STACK, color: brand.neutralColor }}
            >
              Edits save themselves as you type — there is no save button to remember.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
