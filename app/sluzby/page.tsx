'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';

const WEBHOOK_URL = 'https://n8n.korysol.cz/webhook/THELEADWAY_WEBHOOK';

function AnimatedCheck() {
  return (
    <svg viewBox="0 0 52 52" className="anim-check">
      <circle cx="26" cy="26" r="24" className="anim-check-circle"/>
      <path d="M14 26 L22 34 L38 18" className="anim-check-path"/>
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

const CHECKS = [
  'Široký rozsah finančních služeb',
  'Vysoká profesionalita',
  'Důsledný finanční servis',
  'Individuální přístup',
];

const SERVICES = [
  {
    title: 'INVESTICE A ZHODNOCENÍ FINANCÍ',
    body: 'Od tradičních investic po moderní přístupy v rámci „family office" – správa bohatství a investic jednotlivců i rodin.',
  },
  {
    title: 'SPOŘENÍ NA DŮCHOD A BUDOUCNOST DĚTÍ',
    body: 'Vytvoříme plán, který vám přinese jistotu a zajistí vaši finanční budoucnost i budoucnost vašich blízkých.',
  },
  {
    title: 'HYPOTÉKY A BANKOVNÍ PŮJČKY',
    body: 'Pomůžeme vám najít nejvýhodnější řešení na trhu. Srovnáme nabídky bank a provedeme vás celým procesem od A do Z.',
  },
  {
    title: 'FIREMNÍ FINANCOVÁNÍ',
    body: 'Pro podnikatele hledající efektivní finanční strategii. Nastavíme optimální strukturu financování vašeho podnikání.',
  },
];

export default function Sluzby() {
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const contactFormRef = useRef<HTMLFormElement>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScroll = useCallback(() => {
    headerRef.current?.classList.toggle('scrolled', window.scrollY > 80);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
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
          source: 'TheLeadway - Služby',
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
          <a href="/"><img src="/images/theleadway_logo.png" alt="theleadway"/></a>
        </div>
        <button ref={menuToggleRef} className="menu-toggle" aria-label="Menu">
          <span/><span/><span/>
        </button>
        <nav ref={navRef}>
          <a href="/">Domů</a>
          <a href="/sluzby" className="nav-active">Služby</a>
          <a href="/financni-zdravi">Finanční zdraví</a>
          <a href="/#reference">Reference</a>
          <a href="/#kalkulator">Spolupráce</a>
          <a href="#kontakt" className="nav-cta-btn">Kontakt</a>
        </nav>
      </header>

      {/* INTRO SPLIT */}
      <section className="intro-split intro-split--standalone">

        {/* Levý sloupec — tmavý */}
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
            Hledáte kvalitní finanční služby v Olomouci? Máte zájem o řešení pro zabezpečení své rodiny,
            zhodnocení financí nebo plánování budoucnosti? Jste na správném místě!
          </p>
          <p className="intro-quote-text">
            Naše finanční služby jsou přizpůsobené vašim potřebám, ať už jste mladá rodina,
            aktivní jednotlivec s investiční vizí nebo rodič s cílem spořit pro své děti.
          </p>
          <ul className="intro-checks">
            {CHECKS.map(c => (
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

        {/* Pravý sloupec — světlý */}
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
            Nabízíme komplexní finanční poradenství přizpůsobené vašim cílům a životní situaci:
          </p>
          <div className="accordion-list">
            {SERVICES.map((s, i) => (
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.22 2 2 0 012.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
              </svg>
              <a href="tel:+420775180127">+420 775 180 127</a>
            </div>
            <div className="contact-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href="mailto:info@theleadway.cz">info@theleadway.cz</a>
            </div>
            <div className="contact-detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
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
          <a href="/">Domů</a>
          <a href="/sluzby">Služby</a>
          <a href="/financni-zdravi">Finanční zdraví</a>
          <a href="/#kalkulator">Kalkulačka</a>
          <a href="/#reference">Reference</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <p>© {new Date().getFullYear()} TheLeadway – Finanční profesionál</p>
      </footer>
    </>
  );
}
