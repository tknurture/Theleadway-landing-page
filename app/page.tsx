'use client';

import { useEffect, useRef, useState, useCallback, type ReactElement } from 'react';
import Lenis from 'lenis';

/* ── Math ── */
function calcMonthlyPayment(principal: number, annualRatePercent: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
function formatCzk(n: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);
}
function formatNum(n: number) {
  return new Intl.NumberFormat('cs-CZ').format(Math.round(n));
}

const WEBHOOK_URL = 'https://n8n.korysol.cz/webhook/c9469ec2-8ac3-4c57-9295-3dc1788ee840';
const INTEREST_RATE = 4.55;

function AnimatedCheck() {
  return (
    <svg viewBox="0 0 52 52" className="anim-check">
      <circle cx="26" cy="26" r="24" className="anim-check-circle"/>
      <path d="M14 26 L22 34 L38 18" className="anim-check-path"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

/* ── Service icons (indigo) ── */
const SERVICE_ICONS: Record<string, ReactElement> = {
  hypoteka: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 30 L32 10 L56 30"/>
      <path d="M14 28 V54 H50 V28"/>
      <rect x="26" y="36" width="12" height="18"/>
      <path d="M40 14 V22 L44 22 V14"/>
    </svg>
  ),
  refinancovani: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 22 A22 22 0 0 1 54 22"/>
      <polyline points="46 14 54 22 46 30"/>
      <path d="M54 42 A22 22 0 0 1 10 42"/>
      <polyline points="18 50 10 42 18 34"/>
    </svg>
  ),
  investice: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 48 24 32 32 40 56 16"/>
      <polyline points="46 16 56 16 56 26"/>
      <line x1="8" y1="56" x2="56" y2="56"/>
    </svg>
  ),
  pojisteni: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z"/>
      <polyline points="22 32 30 40 44 24"/>
    </svg>
  ),
  sporeni: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="22"/>
      <path d="M32 18 V46"/>
      <path d="M26 24 H36 A4 4 0 0 1 36 32 H28 A4 4 0 0 0 28 40 H38"/>
    </svg>
  ),
  planovani: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="12" width="44" height="44" rx="3"/>
      <line x1="10" y1="24" x2="54" y2="24"/>
      <line x1="22" y1="6" x2="22" y2="18"/>
      <line x1="42" y1="6" x2="42" y2="18"/>
      <polyline points="20 38 28 46 44 30"/>
    </svg>
  ),
};

const SERVICES_GRID = [
  { key: 'hypoteka',     img: 'Jak-byt-rentier-Olomouc.jpg',          title: 'RENTA',                  text: 'Jak si představujete život bez nutnosti vydělávat peníze? Možná to zní nereálně, ale není. Klíčová otázka je: Co už teď děláte pro to, aby se tato vize stala realitou?' },
  { key: 'refinancovani',img: 'Bydleni-Olomouc.jpg',                  title: 'BYDLENÍ',                text: 'Jak si představujete ideální bydlení? Byt, nebo dům? Ve městě, na horách, nebo u moře? Pokud byste měli neomezený rozpočet, jak by vypadal váš domov?' },
  { key: 'investice',    img: 'Sporeni-a-investice-Olomouc.jpg',       title: 'SPOŘENÍ & INVESTICE',    text: 'Má smysl budovat finanční rezervy na stabilním základě? Místo půjček na vybavení, dovolenou nebo auto by mohlo být výhodnější spořit. Finanční plán by měl zohledňovat i krátkodobé a střednědobé cíle.' },
  { key: 'pojisteni',    img: 'Zvyseni-prijmu-Olomouc.jpg',            title: 'ZVÝŠENÍ PŘÍJMU',         text: 'Potřebovali byste pár tisíc navíc každý měsíc? Představte si, co byste mohli s 5–10 tisíci udělat — nové vybavení, vysněné auto, relaxační víkendy, nebo nezapomenutelné zážitky s rodinou.' },
  { key: 'sporeni',      img: 'Zabezpeceni-Olomouc.jpg',              title: 'ZABEZPEČENÍ',            text: 'Co kdybychom vám řekli, že i když vám práce už nikdy nevydělá ani korunu navíc, vaše cíle stále mohou být dosažitelné? Ukážeme vám, jak se rozumně a efektivně zabezpečit proti ztrátě příjmu.' },
  { key: 'planovani',    img: 'Zvyseni-prijmu-Olomouc.jpg',            title: 'FINANČNÍ PORADENSTVÍ',   text: 'Finanční poradenství představuje komplexní službu zaměřenou na efektivní správu a růst vašich financí. Jsme tu pro vás s individuálním přístupem a širokým spektrem služeb.' },
];

const BENEFITS = [
  'Široký rozsah finančních služeb',
  'Vysoká profesionalita',
  'Důsledný finanční servis',
  'Individuální přístup',
];

/* ── Data ze stránky Služby ── */
const SLUZBY_CHECKS = [
  'Široký rozsah finančních služeb',
  'Vysoká profesionalita',
  'Důsledný finanční servis',
  'Individuální přístup',
];

const SLUZBY_ACCORDION = [
  {
    title: 'INVESTICE A ZHODNOCENÍ FINANCÍ',
    body: 'Od tradičních investic po moderní přístupy v rámci „family office" – správa bohatství a investic jednotlivců i rodin.',
  },
  {
    title: 'SPOŘENÍ NA DŮCHOD A BUDOUCNOST DĚTÍ',
    body: 'Vytvoříme plán, který vám přinese jistotu a zajistí vaši finanční budoucnost i budoucnost vašich blízkých.',
  },
  {
    title: 'HYPOTÉKY A BANKOVNÍ PŮJČKY',
    body: 'Pomůžeme vám najít nejvýhodnější řešení na trhu. Srovnáme nabídky bank a provedeme vás celým procesem od A do Z.',
  },
  {
    title: 'FIREMNÍ FINANCOVÁNÍ',
    body: 'Pro podnikatele hledající efektivní finanční strategii. Nastavíme optimální strukturu financování vašeho podnikání.',
  },
];

/* ── Data ze stránky Finanční zdraví ── */
const FZ_CHECKS = [
  'Zlepšení finančního zdraví',
  'Ochrana před riziky',
  'Chytré investice',
  'Pravidelné sledování finančního plánu',
];

const FZ_RULES = [
  {
    title: 'ZBAVTE SE DRAHÝCH DLUHŮ',
    body: 'Draze půjčené peníze vysají vaši peněženku rychlostí blesku. Úvěry na zbytné věci jsou nejdražší. Týden dovolené splácíte rok, dva. Nákupy na kreditní karty sice udělají parádu, ale jejich splácení bude opravdu těžké.',
  },
  {
    title: 'VYTVOŘTE SI PROVOZNÍ REZERVU',
    body: 'Na běžný provoz domácnosti by měl mít každý vytvořenu rezervu, z které pokryje případné nenadálé výdaje. Rezerva by se měla pohybovat v takové výši, aby pokryla šest měsíců výdajů domácnosti. Je dobré ji uložit například na spořicí účet.',
  },
  {
    title: 'DOBŘE A LEVNĚ POJISTĚTE RODINU A MAJETEK',
    body: 'Opatrnost znamená se zabezpečit v případě nečekaných událostí — mít kvalitní a levné pojištění, jak v případě škod na majetku, tak na zdraví. Češi zejména zapomínají na pojištění invalidity z jakékoli příčiny.',
  },
  {
    title: 'VYŘEŠTE SI VLASTNÍ BYDLENÍ',
    body: 'Pro pořízení vlastního bydlení je třeba mít alespoň 20 % z pořizovací ceny nemovitosti. Výše dluhu by neměla překročit devítinásobek ročního čistého příjmu a splátka maximálně 45 % měsíčního příjmu. Proto pořízení bydlení vyžaduje dlouhodobou přípravu a finanční plánování.',
  },
  {
    title: 'PRAVIDELNĚ INVESTUJTE A NESPEKULUJTE',
    body: 'Penze od státu je velmi nejistá proměnná. Jedinou jistotu získáte, pokud si na důchod budete tvořit rezervy sami. Čas hraje ve prospěch zhodnocení — čím dříve začnete, tím levnější to bude. Pravidelných 3 000 Kč měsíčně po dobu 30 let může přinést přes 2 miliony korun.',
  },
  {
    title: 'NEDRŽTE PROSTŘEDKY NA BĚŽNÝCH ÚČTECH',
    body: 'Volné prostředky na běžných nebo termínovaných účtech ztrácejí hodnotu vlivem inflace. Zvažte spořicí účty s vyšším úrokem, podílové fondy nebo jiné nástroje, které vaše peníze reálně zhodnotí.',
  },
  {
    title: 'OPTIMALIZUJTE DRAHÉ PRODUKTY',
    body: 'Důležité je nejen mít finanční produkty, ale mít je správně nastavené. Pojistná rizika jako invalidita či smrt krytá v řádech stotisíců korun nemusí být dostačující. Špatně nastavené pojistné produkty jsou opravdu drahé — zjistíte to, až se něco stane.',
  },
];

const CASE_STUDIES = [
  {
    category: 'Renta',
    label: 'klient z praxe',
    client: 'Rodina s hypotékou',
    before: [
      'V roce 2019 rodina kupovala dům.',
      'Financování tehdy probíhalo „natřikrát" = 3 úvěry, každý jiného typu.',
      'V roce 2020 proběhl náš první kontakt.',
    ],
    after: [
      'Do půl roku jsme dokázali spojit všechny dluhy do jednoho.',
      'Došlo i k optimalizaci dosavadních podkladových smluv a k pojmenování rodinných cílů.',
      'Z původního stavu, kdy v roce 2019 měli mimo dluhy naspořeno jen necelých 100 tis. Kč, jsou nyní zadluženi levněji, zabezpečeni adekvátně pro dlouhodobá rizika (vč. dvouleté dcerky) a jejich celkový kapitálový majetek tvoří cca 340 tis. Kč.',
    ],
    results: [
      'Kapitálový majetek navýšen o 240 000 Kč',
      'Měsíčně bylo ušetřeno cca 5 500 Kč',
      'Optimalizace smluv a pojmenování rodinných cílů',
    ],
  },
  {
    category: 'Navýšení příjmu',
    label: 'klient z praxe',
    client: 'Student téměř bez příjmu',
    before: [
      'V lednu 2021 proběhla první schůzka se studentem (20 let), který byl téměř bez příjmu.',
      'Nebyl nikdy veden ke spoření – nulová rezerva.',
    ],
    after: [
      'Student po 6 měsících získal stabilní brigádu, ze které dokázal ušetřit 3 000 Kč.',
      '1 000 Kč měsíčně jsme přesunuli do dlouhodobé investice (akciový podílový fond).',
      '2 000 Kč měsíčně si spořil do garantovaného depozitního fondu.',
    ],
    results: [
      'Peníze začaly „pracovat" a vznikla dostatečná rezerva',
      'V květnu 2022 měl klient připraveny prostředky na dovolenou',
      'Pochopení disciplíny, pravidelnosti a důslednosti',
    ],
  },
  {
    category: 'Předdůchodové zajištění',
    label: 'klient z praxe',
    client: 'Předdůchod',
    before: [
      'Klient s primárním cílem „zajistit předdůchod".',
      'Při schůzce jsme zjistili, že mu nic nebrání měsíčně investovat zbylé peníze a tvořit si rezervy.',
    ],
    after: [
      'Měsíčně investice do podílových fondů 6 000 Kč.',
      'Vlastní a pronajímá několik bytů v Přerově — rozhodl se vyměnit nejméně jeden za rekreační apartmán.',
      'Výměna přinese zajímavější pasivní příjem i dovolenou dvakrát do roka.',
    ],
    results: [
      'Vytvoření rezervy díky investici do podílových fondů',
      'Zvýšení pasivního příjmu — výměna bytu za rekreační apartmán',
      'Každý klient je unikátní a přistupujeme k němu individuálně',
    ],
  },
];

export default function Home() {
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /* ── Calc state ── */
  const [propertyPrice, setPropertyPrice] = useState<number | ''>('');
  const [downPayment, setDownPayment] = useState<number | ''>('');
  const [termYears, setTermYears] = useState(25);
  const propertyNum = typeof propertyPrice === 'number' ? propertyPrice : 0;
  const downPaymentNum = typeof downPayment === 'number' ? downPayment : 0;
  const loanAmount = Math.max(0, propertyNum - downPaymentNum);
  const downPaymentPct = propertyNum > 0 ? ((downPaymentNum / propertyNum) * 100).toFixed(1) : '0';
  const monthlyPayment = calcMonthlyPayment(loanAmount, INTEREST_RATE, termYears);

  /* ── Carousel state ── */
  const [caseIdx, setCaseIdx] = useState(0);
  const caseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCaseInterval = useCallback(() => {
    if (caseIntervalRef.current) clearInterval(caseIntervalRef.current);
    caseIntervalRef.current = setInterval(() => {
      setCaseIdx(i => (i + 1) % CASE_STUDIES.length);
    }, 5000);
  }, []);
  useEffect(() => {
    startCaseInterval();
    return () => { if (caseIntervalRef.current) clearInterval(caseIntervalRef.current); };
  }, [startCaseInterval]);
  const gotoCase = (idx: number) => {
    setCaseIdx((idx + CASE_STUDIES.length) % CASE_STUDIES.length);
    startCaseInterval();
  };

  /* ── Form state ── */
  const [calcName, setCalcName] = useState('');
  const [calcPhone, setCalcPhone] = useState('');
  const [calcEmail, setCalcEmail] = useState('');
  const [calcMesto, setCalcMesto] = useState('');
  const [calcPsc, setCalcPsc] = useState('');
  const [calcNote, setCalcNote] = useState('');
  const [calcSubmitting, setCalcSubmitting] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [calcRevealed, setCalcRevealed] = useState(false);
  const [calcMsg, setCalcMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contactFormRef = useRef<HTMLFormElement>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScroll = useCallback(() => {
    headerRef.current?.classList.toggle('scrolled', window.scrollY > 80);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true, syncTouch: false });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    const rafId = requestAnimationFrame(raf);

    window.addEventListener('scroll', handleScroll, { passive: true });

    let scrollPos = 0;
    const toggle = menuToggleRef.current;
    const nav = navRef.current;
    const openMenu = () => {
      scrollPos = window.scrollY;
      toggle?.classList.add('active');
      nav?.classList.add('active');
      document.body.classList.add('menu-open');
      document.body.style.top = `-${scrollPos}px`;
    };
    const closeMenu = () => {
      toggle?.classList.remove('active');
      nav?.classList.remove('active');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollPos);
    };
    toggle?.addEventListener('click', () => (nav?.classList.contains('active') ? closeMenu() : openMenu()));
    nav?.querySelectorAll('a').forEach(l => l.addEventListener('click', closeMenu));

    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      revealObs.disconnect();
    };
  }, [handleScroll]);

  async function handleCalcSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!calcName || !calcPhone || !calcEmail || !calcMesto || !calcPsc) return;
    setCalcSubmitting(true);
    setCalcMsg(null);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jmeno: calcName,
          telefon: calcPhone,
          email: calcEmail,
          mesto: calcMesto,
          psc: calcPsc,
          poznamka: calcNote,
          cena_nemovitosti: propertyNum,
          akontace: downPaymentNum,
          akontace_procent: downPaymentPct,
          vyse_uveru: loanAmount,
          splatnost_let: termYears,
          mesicni_splatka: Math.round(monthlyPayment),
          urokova_sazba: INTEREST_RATE,
          source: 'TheLeadway - Kalkulačka',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setCalcSuccess(true);
        setCalcRevealed(true);
        setCalcName('');
        setCalcPhone('');
        setCalcEmail('');
        setCalcMesto('');
        setCalcPsc('');
        setCalcNote('');
      } else throw new Error();
    } catch {
      setCalcMsg({ type: 'error', text: 'Nepodařilo se odeslat. Zkuste to prosím znovu.' });
    } finally {
      setCalcSubmitting(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setContactSubmitting(true);
    setContactMsg(null);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jmeno: fd.get('jmeno'),
          telefon: fd.get('telefon'),
          email: fd.get('email'),
          zprava: fd.get('zprava'),
          source: 'TheLeadway - Kontakt',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setContactSuccess(true);
        contactFormRef.current?.reset();
        setTimeout(() => setContactSuccess(false), 5000);
      } else throw new Error();
    } catch {
      setContactMsg({ type: 'error', text: 'Nepodařilo se odeslat. Zkuste to prosím znovu.' });
    } finally {
      setContactSubmitting(false);
    }
  }

  return (
    <>
      {/* HEADER */}
      <header ref={headerRef}>
        <div className="logo">
          <img src="/images/theleadway_logo.png" alt="theleadway"/>
        </div>
        <button ref={menuToggleRef} className="menu-toggle" aria-label="Menu">
          <span/><span/><span/>
        </button>
        <nav ref={navRef}>
          <a href="#">Domů</a>
          <a href="#sluzby">Služby</a>
          <a href="#financni-zdravi">Finanční zdraví</a>
          <a href="#reference">Reference</a>
          <a href="#kalkulator">Kalkulačka</a>
          <a href="#spoluprace">Spolupráce</a>
          <a href="#kontakt" className="nav-cta-btn">Kontakt</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-img" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}/>
        <div className="hero-overlay"/>
        <div className="hero-inner">
          <div className="hero-content reveal-left">
            <p className="hero-eyebrow-plain">FINANČNÍ A REALITNÍ&nbsp;&nbsp;PORADENSTVÍ</p>
            <h1 className="hero-title">
              <span className="hero-title-line"><span className="accent">JSME</span> FINANČNÍ</span>
              <span className="hero-title-line">&amp; REALITNÍ PROFESIONÁLOVÉ.</span>
            </h1>
            <p className="hero-desc">
              Pomáháme lidem bezpečně a s jistotou zvládat velká životní rozhodnutí.
            </p>
            <div className="hero-ctas">
              <a href="#kontakt" className="btn btn-primary">KONTAKTUJTE NÁS</a>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO SPLIT — O nás */}
      <section className="intro-split" id="vyhody">
        <div className="intro-col intro-col-dark reveal-left">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">FINANČNÍ PORADENSTVÍ</h2>
          <svg className="intro-quote" viewBox="0 0 40 30" fill="currentColor">
            <path d="M0 30 L0 18 C0 8, 5 2, 14 0 L16 5 C11 7, 8 12, 8 16 L12 16 L12 30 Z"/>
            <path d="M22 30 L22 18 C22 8, 27 2, 36 0 L38 5 C33 7, 30 12, 30 16 L34 16 L34 30 Z"/>
          </svg>
          <p className="intro-quote-text"><strong>Jsme TheLeadway.</strong></p>
          <p className="intro-quote-text">
            Pomáháme lidem plnit si ambiciózní cíle, inspirujeme je k růstu
            a budování majetku – finanční nezávislosti.
          </p>
        </div>

        <div className="intro-col intro-col-light reveal-right">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">PROČ SPOLUPRACOVAT S NÁMI?</h2>
          <div className="intro-divider"/>
          <ul className="intro-checks">
            {BENEFITS.map(b => (
              <li key={b}>
                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="20" cy="20" r="17"/>
                  <polyline points="12 20 18 26 28 15"/>
                </svg>
                <span>{b.toUpperCase()}</span>
              </li>
            ))}
          </ul>
          <svg className="intro-quote" viewBox="0 0 40 30" fill="currentColor">
            <path d="M0 30 L0 18 C0 8, 5 2, 14 0 L16 5 C11 7, 8 12, 8 16 L12 16 L12 30 Z"/>
            <path d="M22 30 L22 18 C22 8, 27 2, 36 0 L38 5 C33 7, 30 12, 30 16 L34 16 L34 30 Z"/>
          </svg>
          <p className="intro-quote-text">
            Naší rolí je být na této cestě oporou a spolehlivým partnerem
            právě pro ty věci, které byste neměli řešit sami.
          </p>
        </div>
      </section>

      {/* CO VÁM MŮŽEME POMOCI — grid karet (3. sekce) */}
      <section className="services" id="co-umime">
        <div className="section-inner">
          <div className="services-header reveal">
            <svg className="services-logo-icon" viewBox="0 0 120 80" fill="none">
              <path d="M60 8 L14 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 8 L106 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 20 L26 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 20 L94 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 32 L38 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 32 L82 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 44 L50 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 44 L70 72" stroke="#3330B8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h2 className="services-main-title">S ČÍM VÁM MŮŽEME POMOCI?</h2>
          </div>
          <div className="services-grid-new">
            {SERVICES_GRID.map((s, i) => (
              <div key={s.key} className="service-card-new reveal" style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}>
                <div className="service-img-wrap">
                  <img src={`/images/services/${s.img}`} alt={s.title} className="service-img"/>
                </div>
                <h3 className="service-card-title">{s.title}</h3>
                <p className="service-card-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLUŽBY — přečuhuje do services sekce nad ní */}
      <section className="intro-split intro-split--alt" id="sluzby">
        <div className="intro-col intro-col-dark reveal-left">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">VAŠE JISTOTA VE SVĚTĚ FINANCÍ</h2>
          <svg className="intro-quote" viewBox="0 0 40 30" fill="currentColor">
            <path d="M0 30 L0 18 C0 8, 5 2, 14 0 L16 5 C11 7, 8 12, 8 16 L12 16 L12 30 Z"/>
            <path d="M22 30 L22 18 C22 8, 27 2, 36 0 L38 5 C33 7, 30 12, 30 16 L34 16 L34 30 Z"/>
          </svg>
          <p className="intro-quote-text">
            Hledáte kvalitní finanční služby? Máte zájem o řešení pro zabezpečení své rodiny,
            zhodnocení financí nebo plánování budoucnosti? Jste na správném místě!
          </p>
          <p className="intro-quote-text">
            Naše finanční služby jsou přizpůsobené vašim potřebám, ať už jste mladá rodina,
            aktivní jednotlivec s investiční vizí nebo rodič s cílem spořit pro své děti.
          </p>
          <p className="intro-checks-label">Co nabízíme</p>
          <ul className="intro-checks">
            {SLUZBY_CHECKS.map(c => (
              <li key={c}>
                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="20" cy="20" r="17"/>
                  <polyline points="12 20 18 26 28 15"/>
                </svg>
                <span>{c.toUpperCase()}</span>
              </li>
            ))}
          </ul>
          <a href="#kontakt" className="btn btn-primary">KONTAKTUJTE NÁS</a>
        </div>

        <div className="intro-col intro-col-light reveal-right">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">JAKÉ FINANČNÍ SLUŽBY POSKYTUJEME?</h2>
          <div className="intro-divider"/>
          <p className="intro-quote-text" style={{ marginBottom: '24px' }}>
            Nabízíme komplexní finanční poradenství přizpůsobené vašim cílům a životní situaci:
          </p>
          <div className="accordion-list">
            {SLUZBY_ACCORDION.map((s, i) => (
              <div className="accordion-item" key={i}>
                <details>
                  <summary>
                    <span className="accordion-num">{i + 1}</span>
                    <span>{s.title}</span>
                    <ChevronDown/>
                  </summary>
                  <p className="accordion-body">{s.body}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINANČNÍ ZDRAVÍ */}
      <section className="intro-split intro-split--alt" id="financni-zdravi">
        <div className="intro-col intro-col-light reveal-left">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">7 ZLATÝCH PRAVIDEL</h2>
          <div className="intro-divider"/>
          <p className="intro-quote-text" style={{ marginBottom: '24px' }}>
            Zabýváme se finančním plánováním a správou majetku. Pomáháme lidem řídit se 7 zlatými pravidly:
          </p>
          <div className="accordion-list">
            {FZ_RULES.map((r, i) => (
              <div className="accordion-item" key={i}>
                <details>
                  <summary>
                    <span className="accordion-num">{i + 1}</span>
                    <span>{r.title}</span>
                    <ChevronDown/>
                  </summary>
                  <p className="accordion-body">{r.body}</p>
                </details>
              </div>
            ))}
          </div>
        </div>

        <div className="intro-col intro-col-dark reveal-right">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/><path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/><path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/><path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/><path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">FINANČNÍ ZDRAVÍ</h2>
          <svg className="intro-quote" viewBox="0 0 40 30" fill="currentColor">
            <path d="M0 30 L0 18 C0 8, 5 2, 14 0 L16 5 C11 7, 8 12, 8 16 L12 16 L12 30 Z"/>
            <path d="M22 30 L22 18 C22 8, 27 2, 36 0 L38 5 C33 7, 30 12, 30 16 L34 16 L34 30 Z"/>
          </svg>
          <p className="intro-quote-text"><strong>Zajistíme finanční zdraví a efektivní hospodaření s penězi.</strong></p>
          <p className="intro-quote-text">
            Pomáháme lidem získat kontrolu nad jejich financemi a dosáhnout finančního zdraví.
            Společně zhodnotíme vaši situaci, nastavíme jasné cíle a vytvoříme plán pro efektivní hospodaření s penězi:
          </p>
          <p className="intro-checks-label">Co nabízíme</p>
          <ul className="intro-checks">
            {FZ_CHECKS.map(c => (
              <li key={c}>
                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="20" cy="20" r="17"/>
                  <polyline points="12 20 18 26 28 15"/>
                </svg>
                <span>{c.toUpperCase()}</span>
              </li>
            ))}
          </ul>
          <a href="#kontakt" className="btn btn-primary">KONTAKTUJTE NÁS</a>
        </div>
      </section>
            {/* KALKULAČKA */}
      <section className="calculator" id="kalkulator">
        <div className="calculator-inner">
          <div className="calc-left reveal-left">
            <p className="section-eyebrow">Kalkulačka splátky</p>
            <h2 className="section-title">Spočítejte si hypotéku přesně</h2>
            <p className="calc-lead">
              Hezké bydlení, pohodový život a rozumná investice do budoucna.
              Sjednejte si hypoteční úvěr s naší pomocí.
            </p>

            <div className="calc-info-block">
              <h3 className="calc-info-title">Jaký bude průběh?</h3>
              <ol className="calc-info-list calc-info-list--ordered">
                <li>Vyplňte krátký formulář</li>
                <li>Bude Vás kontaktovat hypoteční specialista</li>
                <li>Vše za vás <strong>ZDARMA</strong> zařídíme</li>
                <li>Na základě informací od Vás Vám připraví nabídku hypotéky</li>
              </ol>
            </div>

            <div className="calc-info-block">
              <h3 className="calc-info-title">Hlavní výhody hypotéky:</h3>
              <ul className="calc-info-list">
                <li>Bez poplatků za vyřízení</li>
                <li>Výhodné úroky a slevy</li>
                <li>Flexibilní měsíční splátky</li>
                <li>Široké možnosti využití hypotéky</li>
                <li>Možnost refinancování hypotéky od jiné banky</li>
                <li>Až do 90 % hodnoty zastavené nemovitosti</li>
              </ul>
            </div>
          </div>

          <div className="calc-card reveal-right">
            <div className="calc-card-title">Kalkulačka hypotéky</div>
            <div className="calc-card-sub">Orientační výpočet při sazbě {INTEREST_RATE} % p.a.</div>

            <div className="calc-field">
              <label>Cena nemovitosti <span className="required">*</span></label>
              <div className="input-wrap">
                <input
                  type="number" min={0} step={10000} placeholder="např. 5 000 000"
                  value={propertyPrice}
                  onChange={e => setPropertyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="input-currency">Kč</span>
              </div>
            </div>

            <div className="calc-field">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Akontace (vlastní zdroje) <span className="required">*</span></span>
                {propertyNum > 0 && <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--indigo)' }}>{downPaymentPct} %</span>}
              </label>
              <div className="input-wrap">
                <input
                  type="number" min={0} max={propertyNum || undefined} step={10000} placeholder="např. 1 000 000"
                  value={downPayment}
                  onChange={e => setDownPayment(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="input-currency">Kč</span>
              </div>
            </div>

            <div className="calc-field">
              <label>Výše hypotéky</label>
              <div className="input-wrap">
                <input
                  type="text" readOnly
                  value={loanAmount > 0 ? formatNum(loanAmount) : ''}
                  placeholder="= cena nemovitosti − akontace"
                  style={{ background: 'var(--bg-soft)', color: loanAmount > 0 ? 'var(--text-dark)' : 'var(--text-muted)', fontWeight: loanAmount > 0 ? 600 : 400 }}
                />
                <span className="input-currency">Kč</span>
              </div>
            </div>

            <div className="calc-slider-field">
              <div className="calc-slider-label">
                <span>Délka splatnosti <span className="required">*</span></span>
                <span className="calc-slider-value">{termYears} {termYears === 1 ? 'rok' : termYears < 5 ? 'roky' : 'let'}</span>
              </div>
              <div className="slider-row">
                <span>1 rok</span>
                <input
                  type="range" min={1} max={30} value={termYears}
                  onChange={e => setTermYears(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, var(--indigo) 0%, var(--indigo) ${((termYears - 1) / 29) * 100}%, var(--indigo-light) ${((termYears - 1) / 29) * 100}%, var(--indigo-light) 100%)` }}
                />
                <span>30 let</span>
              </div>
            </div>

            <div className={`calc-result${!calcRevealed ? ' calc-result--locked' : ''}`}>
              <div>
                <div className="calc-result-label">Měsíční splátka</div>
                <div className="calc-result-note">*orientační, při sazbě {INTEREST_RATE} % p.a.</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {calcRevealed
                  ? <div className="calc-result-amount">{monthlyPayment > 0 ? formatCzk(monthlyPayment) : '— Kč'}</div>
                  : <div className="calc-result-amount calc-result-amount--hidden">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Vyplňte formulář
                    </div>
                }
              </div>
            </div>

            <div className="calc-divider"/>

            {calcSuccess ? (
              <div className="calc-success-state">
                <AnimatedCheck/>
                <p>Děkujeme! Vaše měsíční splátka je <strong>{monthlyPayment > 0 ? formatCzk(monthlyPayment) : '—'}</strong>. Ozveme se vám co nejdříve.</p>
              </div>
            ) : (
              <>
                <div className="calc-form-title">Odeslat nezávaznou poptávku</div>
                <form onSubmit={handleCalcSubmit}>
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="form-label">Jméno a příjmení <span className="required">*</span></label>
                      <input type="text" placeholder="Jméno a příjmení" value={calcName} onChange={e => setCalcName(e.target.value)} required/>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Telefon <span className="required">*</span></label>
                      <input type="tel" placeholder="Telefon" value={calcPhone} onChange={e => setCalcPhone(e.target.value)} required/>
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input type="email" placeholder="Email" value={calcEmail} onChange={e => setCalcEmail(e.target.value)} required/>
                  </div>
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="form-label">Město <span className="required">*</span></label>
                      <input type="text" placeholder="Město" value={calcMesto} onChange={e => setCalcMesto(e.target.value)} required/>
                      <p className="form-field-hint">Slouží k určení poradce ve Vaší oblasti.</p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">PSČ <span className="required">*</span></label>
                      <input type="text" placeholder="PSČ" inputMode="numeric" pattern="[0-9 ]*" value={calcPsc} onChange={e => setCalcPsc(e.target.value)} required/>
                    </div>
                  </div>
                  <div className="form-field" style={{marginTop:'4px'}}>
                    <label className="form-label">Poznámka</label>
                    <textarea placeholder="Volitelná poznámka..." value={calcNote} onChange={e => setCalcNote(e.target.value)} rows={2} style={{resize:'none'}}/>
                  </div>
                  <p className="form-consent">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{flexShrink:0, marginTop:'2px'}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Odesláním formuláře souhlasíte se zpracováním osobních údajů za účelem poskytnutí hypoteční nabídky. Budeme Vás kontaktovat na základě zadaných údajů.
                  </p>
                  <button type="submit" className="form-submit-btn" disabled={calcSubmitting}>
                    {calcSubmitting ? 'Odesílám…' : 'ODESLAT NEZÁVAZNOU POPTÁVKU'}
                  </button>
                  {calcMsg && <div className={`form-message ${calcMsg.type}`}>{calcMsg.text}</div>}
                </form>
              </>
            )}
          </div>
        </div>
      </section>
      {/* REFERENCE */}
      <section className="testimonials" id="reference">
        <div className="section-inner">
          <div className="section-header reveal">
            <p className="section-eyebrow">Reference finančních služeb</p>
            <h2 className="section-title">Klienti z praxe</h2>
          </div>

          <div className="carousel-wrap">
            <button className="carousel-arrow carousel-arrow--prev" onClick={() => gotoCase(caseIdx - 1)} aria-label="Předchozí">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <div className="carousel-stage">
              {CASE_STUDIES.map((c, idx) => (
                <div key={idx} className={`case-card-new${idx === caseIdx ? ' active' : idx === (caseIdx - 1 + CASE_STUDIES.length) % CASE_STUDIES.length ? ' prev' : ' next'}`}>
                  <div className="case-card-header">
                    <div>
                      <div className="case-category">{c.category}</div>
                      <h3 className="case-client">{c.client}</h3>
                    </div>
                    <div className="case-counter">{idx + 1} / {CASE_STUDIES.length}</div>
                  </div>

                  <div className="case-columns">
                    <div className="case-col">
                      <div className="case-col-label case-before-title">Před spoluprací</div>
                      <ul className="case-list">
                        {c.before.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                    <div className="case-col">
                      <div className="case-col-label case-after-title">Po spolupráci</div>
                      <ul className="case-list">
                        {c.after.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="case-results">
                    <div className="case-results-title">Výsledky spolupráce</div>
                    <ul className="case-results-list">
                      {c.results.map((r, i) => (
                        <li key={i}>
                          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button className="carousel-arrow carousel-arrow--next" onClick={() => gotoCase(caseIdx + 1)} aria-label="Další">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div className="carousel-dots">
            {CASE_STUDIES.map((_, i) => (
              <button key={i} className={`carousel-dot${i === caseIdx ? ' active' : ''}`} onClick={() => gotoCase(i)} aria-label={`Slide ${i + 1}`}/>
            ))}
          </div>

          <blockquote className="cases-closing reveal">
            „Každý klient je unikátní a jako k takovému je třeba k němu&nbsp;/&nbsp;k&nbsp;ní přistupovat."
          </blockquote>
        </div>
      </section>

      {/* SPOLUPRÁCE */}
      <section className="collab" id="spoluprace">
        <div className="collab-inner">
          <div className="collab-left reveal-left">
            <p className="section-eyebrow">Kariéra</p>
            <h2 className="collab-title">Hledáš příležitost růst?</h2>
            <p className="collab-lead">
              V TheLeadWay hledáme ambiciózní lidi, kteří chtějí víc než jen běžnou práci.
              Ať už máš zkušenosti z financí, obchodu nebo teprve začínáš — důležitá je hlavně chuť na sobě pracovat.
            </p>
            <p className="collab-sublabel">Co u nás najdeš?</p>
            <ul className="collab-list">
              {[
                'Silné zázemí a podporu',
                'Možnost kariérního i osobního růstu',
                'Flexibilitu a svobodu',
                'Férové ohodnocení',
                'Tým lidí, kteří táhnou za jeden provaz',
              ].map(item => (
                <li key={item}>
                  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="20" cy="20" r="17"/>
                    <polyline points="12 20 18 26 28 15"/>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="collab-right reveal-right">
            <p className="collab-sublabel">Pro koho je spolupráce vhodná?</p>
            <p className="collab-for-text">Pro lidi, kteří chtějí:</p>
            <ul className="collab-for-list">
              {[
                'Pracovat s lidmi',
                'Rozvíjet se',
                'Budovat něco vlastního',
                'Mít výsledky ve svých rukou',
              ].map(item => (
                <li key={item}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="collab-cta-box">
              <p className="collab-cta-title">Zaujalo tě to?</p>
              <p className="collab-cta-text">Spoj se s námi a zjisti, jestli si sedneme.</p>
              <a href="#kontakt" className="btn btn-primary">NAPIŠTE NÁM</a>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAKT */}
      <section className="contact" id="kontakt">
        <div className="contact-inner">
          <div className="reveal-left">
            <p className="section-eyebrow">Kontakt</p>
            <h2 className="contact-title">Sjednejme si schůzku</h2>
            <p className="contact-lead">
              Pro více informací nás prosím kontaktujte telefonicky, e-mailem,
              nebo pomocí kontaktního formuláře. Děkujeme Vám.
            </p>
            <div className="contact-detail">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.22 2 2 0 012.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
              <a href="tel:+420775180127">+420 775 180 127</a>
            </div>
            <div className="contact-detail">
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <a href="mailto:info@theleadway.cz">info@theleadway.cz</a>
            </div>
            <div className="contact-detail">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Envelopa Office Center, tř. Kosmonautů 1221/2a, 779 00 Olomouc</span>
            </div>
          </div>

          <div className="contact-form-wrap reveal-right">
            <h3>Napište nám</h3>
            <p className="contact-form-sub">Pro jakékoli dotazy nás prosím kontaktujte.</p>
            {contactSuccess ? (
              <div className="calc-success-state">
                <AnimatedCheck/>
                <p>Zpráva odeslána. Ozveme se vám brzy!</p>
              </div>
            ) : (
              <form ref={contactFormRef} onSubmit={handleContactSubmit}>
                <div className="contact-form-row">
                  <div className="contact-form-field"><input name="jmeno" type="text" placeholder="Jméno a příjmení" required/></div>
                  <div className="contact-form-field"><input name="email" type="email" placeholder="Email" required/></div>
                </div>
                <div className="contact-form-field"><input name="telefon" type="tel" placeholder="Telefon *" required/></div>
                <div className="contact-form-field"><textarea name="zprava" placeholder="Zpráva"/></div>
                <button type="submit" className="contact-submit-btn" disabled={contactSubmitting}>
                  {contactSubmitting ? 'Odesílám…' : 'ODESLAT'}
                </button>
                {contactMsg && <div className={`contact-form-message ${contactMsg.type}`}>{contactMsg.text}</div>}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo"><img src="/images/theleadway_logo_white.png" alt="theleadway"/></div>
        <div className="footer-links">
          <a href="#sluzby">Služby</a>
          <a href="#vyhody">Výhody</a>
          <a href="#kalkulator">Kalkulačka</a>
          <a href="#reference">Reference</a>
          <a href="#spoluprace">Spolupráce</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <p>© {new Date().getFullYear()} TheLeadway – Finanční profesionál</p>
      </footer>
    </>
  );
}
