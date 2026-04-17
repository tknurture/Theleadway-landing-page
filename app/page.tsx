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

const WEBHOOK_URL = 'https://n8n.korysol.cz/webhook/THELEADWAY_WEBHOOK';
const INTEREST_RATE = 4.55;

/* ── Animated checkmark ── */
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

const SERVICES = [
  { key: 'hypoteka',     img: 'Jak-byt-rentier-Olomouc.jpg',          title: 'RENTA',                  text: 'Jak si představujete život bez nutnosti vydělávat peníze? Možná to zní nereálně, ale není. Klíčová otázka je: Co už teď děláte pro to, aby se tato vize stala realitou?' },
  { key: 'refinancovani',img: 'Bydleni-Olomouc.jpg',                  title: 'BYDLENÍ',                text: 'Jak si představujete ideální bydlení? Byt, nebo dům? Ve městě, na horách, nebo u moře? Pokud byste měli neomezený rozpočet, jak by vypadal váš domov?' },
  { key: 'investice',    img: 'Sporeni-a-investice-Olomouc.jpg',       title: 'SPOŘENÍ & INVESTICE',    text: 'Má smysl budovat finanční rezervy na stabilním základě? Místo půjček na vybavení, dovolenou nebo auto by mohlo být výhodnější spořit. Finanční plán by měl zohledňovat i krátkodobé a střednědobé cíle.' },
  { key: 'pojisteni',    img: 'Zvyseni-prijmu-Olomouc.jpg',            title: 'ZVÝŠENÍ PŘÍJMU',         text: 'Potřebovali byste pár tisíc navíc každý měsíc? Představte si, co byste mohli s 5–10 tisíci udělat — nové vybavení, vysněné auto, relaxační víkendy, nebo nezapomenutelné zážitky s rodinou.' },
  { key: 'sporeni',      img: 'Zabezpeceni-Olomouc.jpg',              title: 'ZABEZPEČENÍ',            text: 'Co kdybychom vám řekli, že i když vám práce už nikdy nevydělá ani korunu navíc, vaše cíle stále mohou být dosažitelné? Ukážeme vám, jak se rozumně a efektivně zabezpečit proti ztrátě příjmu.' },
  { key: 'planovani',    img: 'Zvyseni-prijmu-Olomouc.jpg',            title: 'FINANČNÍ PORADENSTVÍ',   text: 'Finanční poradenství představuje komplexní službu zaměřenou na efektivní správu a růst vašich financí. Jsme tu pro vás s individuálním přístupem a širokým spektrem služeb.' },
];

const BENEFITS = [
  'Široký rozsah finančních služeb',
  'Vysoká profesionalita',
  'Důsledný finanční servis',
  'Individuální přístup',
];

const TESTIMONIALS = [
  { i: 'MK', n: 'Martin K.', m: 'Hypotéka na rodinný dům · Praha', t: '„Díky TheLeadway jsme získali hypotéku za podmínek, které jsme sami nikdy nesehnali. Celý proces byl velmi profesionální a bez stresu."' },
  { i: 'LP', n: 'Lucie P.',  m: 'Refinancování hypotéky · Brno',   t: '„Refinancování proběhlo rychle a ušetřili jsme přes 2 000 Kč měsíčně. Doporučujeme každému, kdo chce výhodnější hypotéku."' },
  { i: 'TN', n: 'Tomáš N.',  m: 'První hypotéka · Ostrava',         t: '„Jako první kupující jsme neměli žádné zkušenosti. Specialista nás provedl každým krokem — od A do Z. Skvělá práce!"' },
];

export default function Home() {
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /* ── Full calc state ── */
  const [propertyPrice, setPropertyPrice] = useState<number | ''>('');
  const [downPayment, setDownPayment] = useState<number | ''>('');
  const [termYears, setTermYears] = useState(25);
  const propertyNum = typeof propertyPrice === 'number' ? propertyPrice : 0;
  const downPaymentNum = typeof downPayment === 'number' ? downPayment : 0;
  const loanAmount = Math.max(0, propertyNum - downPaymentNum);
  const downPaymentPct = propertyNum > 0 ? ((downPaymentNum / propertyNum) * 100).toFixed(1) : '0';
  const monthlyPayment = calcMonthlyPayment(loanAmount, INTEREST_RATE, termYears);

  /* ── Form state ── */
  const [calcName, setCalcName] = useState('');
  const [calcPhone, setCalcPhone] = useState('');
  const [calcEmail, setCalcEmail] = useState('');
  const [calcSubmitting, setCalcSubmitting] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [calcMsg, setCalcMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const contactFormRef = useRef<HTMLFormElement>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    headerRef.current?.classList.toggle('scrolled', y > 80);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    const rafId = requestAnimationFrame(raf);

    window.addEventListener('scroll', handleScroll, { passive: true });

    /* Menu */
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

    /* Reveal observer */
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
    if (!calcName || !calcPhone || !calcEmail) return;
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
        setCalcName('');
        setCalcPhone('');
        setCalcEmail('');
        setTimeout(() => setCalcSuccess(false), 5000);
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
          <a href="/sluzby">Služby</a>
          <a href="/financni-zdravi">Finanční zdraví</a>
          <a href="#reference">Reference</a>
          <a href="#kalkulator">Spolupráce</a>
          <a href="#kontakt" className="nav-cta-btn">Kontakt</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-img" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}/>
        <div className="hero-overlay"/>
        <div className="hero-inner">
          <div className="hero-content reveal-left">
            <p className="hero-eyebrow-plain">FINANČNÍ A REALITNÍ&nbsp;&nbsp;PORADENSTVÍ OLOMOUC</p>
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

      {/* INTRO SPLIT - 2 columns */}
      <section className="intro-split" id="vyhody">
        <div className="intro-col intro-col-dark reveal-left">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/>
            <path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/>
            <path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/>
            <path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/>
            <path d="M60 44 L70 62"/>
          </svg>
          <h2 className="intro-heading">FINANČNÍ PORADENSTVÍ OLOMOUC</h2>
          <svg className="intro-quote" viewBox="0 0 40 30" fill="currentColor">
            <path d="M0 30 L0 18 C0 8, 5 2, 14 0 L16 5 C11 7, 8 12, 8 16 L12 16 L12 30 Z"/>
            <path d="M22 30 L22 18 C22 8, 27 2, 36 0 L38 5 C33 7, 30 12, 30 16 L34 16 L34 30 Z"/>
          </svg>
          <p className="intro-quote-text"><strong>Jsme TheLeadway.</strong></p>
          <p className="intro-quote-text">
            Pomáháme lidem plnit si ambiciózní cíle, inspirujeme je k růstu
            a budování majetku = finanční nezávislosti.
          </p>
        </div>

        <div className="intro-col intro-col-light reveal-right">
          <svg className="intro-triangle" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M60 8 L14 62"/>
            <path d="M60 8 L106 62"/>
            <path d="M60 20 L26 62"/>
            <path d="M60 20 L94 62"/>
            <path d="M60 32 L38 62"/>
            <path d="M60 32 L82 62"/>
            <path d="M60 44 L50 62"/>
            <path d="M60 44 L70 62"/>
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

      {/* SLUŽBY */}
      <section className="services" id="sluzby">
        <div className="section-inner">
          <div className="services-header reveal">
            <svg className="services-logo-icon" viewBox="0 0 120 80" fill="none">
              <path d="M60 8 L14 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 8 L106 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 20 L26 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 20 L94 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 32 L38 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 32 L82 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 44 L50 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M60 44 L70 72" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h2 className="services-main-title">S ČÍM VÁM MOHU POMOCI?</h2>
          </div>
          <div className="services-grid-new">
            {SERVICES.map((s, i) => (
              <div key={s.key} className="service-card-new reveal" style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}>
                <div className="service-img-wrap">
                  <img
                    src={`/images/services/${s.img}`}
                    alt={s.title}
                    className="service-img"
                  />
                </div>
                <h3 className="service-card-title">{s.title}</h3>
                <p className="service-card-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KALKULAČKA */}
      <section className="calculator" id="kalkulator">
        <div className="calculator-inner">
          <div className="calc-left reveal-left">
            <p className="section-eyebrow">Kalkulačka splátky</p>
            <h2 className="section-title">Spočítejte si hypotéku přesně</h2>
            <p className="calc-lead">
              Zadejte cenu nemovitosti, akontaci a dobu splatnosti —
              okamžitě uvidíte orientační výši splátky. Poté nám zanechejte kontakt
              a ozveme se s přesnou nabídkou zdarma.
            </p>
            <div className="calc-trust">
              <div className="calc-trust-item"><CheckIcon/>Bezplatná konzultace bez závazků</div>
              <div className="calc-trust-item"><CheckIcon/>Srovnání nabídek od více bank</div>
              <div className="calc-trust-item"><CheckIcon/>Odpověď do 24 hodin</div>
            </div>
          </div>

          <div className="calc-card reveal-right">
            <div className="calc-card-title">Detailní kalkulačka hypotéky</div>
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

            <div className="calc-result">
              <div>
                <div className="calc-result-label">Měsíční splátka</div>
                <div className="calc-result-note">*orientační, při sazbě {INTEREST_RATE} % p.a.</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="calc-result-amount">{monthlyPayment > 0 ? formatCzk(monthlyPayment) : '— Kč'}</div>
              </div>
            </div>

            <div className="calc-divider"/>

            {calcSuccess ? (
              <div className="calc-success-state">
                <AnimatedCheck/>
                <p>Děkujeme! Ozveme se vám co nejdříve.</p>
              </div>
            ) : (
              <>
                <div className="calc-form-title">Chci bezplatnou konzultaci</div>
                <form onSubmit={handleCalcSubmit}>
                  <div className="form-field"><input type="text" placeholder="Jméno a příjmení *" value={calcName} onChange={e => setCalcName(e.target.value)} required/></div>
                  <div className="form-field"><input type="tel" placeholder="Telefon *" value={calcPhone} onChange={e => setCalcPhone(e.target.value)} required/></div>
                  <div className="form-field"><input type="email" placeholder="E-mail *" value={calcEmail} onChange={e => setCalcEmail(e.target.value)} required/></div>
                  <button type="submit" className="form-submit-btn" disabled={calcSubmitting}>
                    {calcSubmitting ? 'Odesílám…' : 'KONTAKTUJTE MĚ'}
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
            <p className="section-eyebrow">Reference</p>
            <h2 className="section-title">Co říkají naši klienti</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((c, idx) => (
              <div key={idx} className="testimonial-card reveal" style={{ '--delay': `${idx * 100}ms` } as React.CSSProperties}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">{c.t}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{c.i}</div>
                  <div>
                    <div className="testimonial-name">{c.n}</div>
                    <div className="testimonial-meta">{c.m}</div>
                  </div>
                </div>
              </div>
            ))}
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
              Pro více informací nás prosím kontaktujte telefonicky, emailem,
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
          <a href="/sluzby">Služby</a>
          <a href="#vyhody">Výhody</a>
          <a href="#kalkulator">Kalkulačka</a>
          <a href="#reference">Reference</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <p>© {new Date().getFullYear()} TheLeadway – Finanční profesionál</p>
      </footer>
    </>
  );
}
