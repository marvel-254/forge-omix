import { useState } from 'react'
import {
  Leaf,
  Sprout,
  GitBranch,
  Layers,
  Wand2,
  Terminal,
  ArrowRight,
  Menu,
  X,
  Github,
  Boxes,
  Palette,
  Code2,
} from 'lucide-react'

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
      style={{ backgroundImage: GRAIN, backgroundRepeat: 'repeat' }}
    />
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  const links: [string, string][] = [['Features','#features'],['How it works','#how-it-works'],['Install','#install'],['Docs','https://github.com/marvel-254/forge-omix/tree/main/docs']]
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-alabaster/80 border-b border-stone">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="font-serif text-xl font-semibold tracking-tight">
          forge<span className="italic text-sage">@</span>omix
        </a>
        <nav className="hidden items-center gap-8 text-sm tracking-wide md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="text-forest/80 transition-colors duration-300 hover:text-terracotta">
              {label}
            </a>
          ))}
          <a href="#install" className="rounded-full border border-sage px-5 py-2 text-sage transition-colors duration-300 hover:bg-sage hover:text-white">
            Get started
          </a>
        </nav>
        <button className="md:hidden p-2" aria-label="Menu" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-6 border-t border-stone bg-alabaster p-8 text-lg md:hidden">
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
      <div className="flex flex-col justify-center">
        <p className="mb-6 text-sm font-medium uppercase tracking-widest text-sage">
          AI-native visual software builder
        </p>
        <h1 className="font-serif text-5xl font-semibold leading-tight md:text-7xl">
          Grow software the way{' '}
          <em className="italic text-sage">gardens</em> grow.
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-relaxed text-forest/80">
          forge@omix is a visual canvas that stays a machine-readable specification. Design it,
          structure it, and let agents ship production code from the same truth.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#install"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-forest px-8 text-sm uppercase tracking-widest text-white transition-all duration-300 hover:bg-terracotta"
          >
            Start building <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <a
            href="https://github.com/marvel-254/forge-omix"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-sage px-8 text-sm uppercase tracking-widest text-sage transition-colors duration-300 hover:bg-sage hover:text-white"
          >
            <Github className="h-4 w-4" strokeWidth={1.5} /> Source
          </a>
        </div>
      </div>
      <div className="relative flex items-center justify-center">
        <div className="aspect-[3/4] w-full max-w-md overflow-hidden rounded-t-full rounded-b-[40px] bg-gradient-to-b from-sage/40 via-clay/50 to-stone shadow-[0_25px_50px_-12px_rgba(45,58,49,0.15)]">
          <div className="flex h-full flex-col items-center justify-center gap-6 p-10 text-center">
            <Leaf className="h-16 w-16 text-forest/70" strokeWidth={1} />
            <p className="font-serif text-2xl italic leading-relaxed text-forest/80">
              “A canvas that breathes, and a schema that ships.”
            </p>
            <p className="text-xs uppercase tracking-widest text-forest/50">The omix principle</p>
          </div>
        </div>
        <svg className="absolute -bottom-10 -left-10 h-40 w-40 text-sage/60" viewBox="0 0 100 100" fill="none" aria-hidden>
          <path d="M10 90 C 30 60, 60 50, 90 10" stroke="currentColor" strokeWidth="0.6" />
          <path d="M30 78 C 40 70, 45 66, 52 60" stroke="currentColor" strokeWidth="0.6" />
          <path d="M55 55 C 62 50, 66 46, 70 38" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      </div>
    </section>
  )
}

const features = [
  {
    icon: Palette,
    title: 'Design tokens, not divs',
    body: 'Every canvas edit writes through to a typed project schema. Colors, type, and spacing are tokens you can retheme everywhere at once.',
  },
  {
    icon: Wand2,
    title: 'AI agents at the trowel',
    body: 'Brief the builder in plain language. Multi-provider AI drafts pages and structures; you keep veto rights on the canvas.',
  },
  {
    icon: Code2,
    title: 'Code you keep',
    body: 'Export a real React + Vite project or push to git. No lock-in, no proprietary runtime — the output is the repo.',
  },
  {
    icon: GitBranch,
    title: 'Git-native by default',
    body: 'Workspaces are plain git checkouts. Branch, review, and roll back like any other project.',
  },
  {
    icon: Boxes,
    title: 'One container, full stack',
    body: 'nginx, API, and SQLite in a single Docker image. Self-host anywhere with one command.',
  },
  {
    icon: Layers,
    title: 'Library-driven canvas',
    body: 'A curated component library with live props, viewport simulation, and undo/redo baked in.',
  },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <h2 className="max-w-2xl font-serif text-4xl font-semibold md:text-5xl">
        Everything you need, <em className="italic text-sage">nothing</em> that rusted.
      </h2>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`rounded-3xl border border-stone bg-white p-8 shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(45,58,49,0.08)] ${
              i % 2 === 1 ? 'md:translate-y-12' : ''
            }`}
          >
            <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-mushroom">
              <f.icon className="h-6 w-6 text-sage" strokeWidth={1.5} />
            </span>
            <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-forest/75">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Plant the seed', body: 'Create a project from a blank canvas, a template, or an AI brief.' },
    { n: '02', title: 'Tend the canvas', body: 'Compose components, tune design tokens, and preview at every viewport.' },
    { n: '03', title: 'Harvest the code', body: 'Export a production repo, push to git, deploy anywhere.' },
  ]
  return (
    <section id="how-it-works" className="bg-mushroom">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="font-serif text-4xl font-semibold md:text-5xl">
          From idea to orchard in <em className="italic text-sage">three</em> seasons.
        </h2>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="font-serif text-5xl italic text-clay">{s.n}</p>
              <h3 className="mt-4 font-serif text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-forest/75">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Install() {
  return (
    <section id="install" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-4xl font-semibold md:text-5xl">
            One command. <em className="italic text-sage">Full</em> harvest.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-forest/80">
            Install the CLI. It installs Docker when needed, pulls the image, provisions persistent
            storage, and starts the app on port 8080.
          </p>
          <p className="mt-6 text-sm text-forest/60">
            Prefer curl?{' '}
            <a
              href="https://raw.githubusercontent.com/marvel-254/forge-omix/main/install.sh"
              className="rounded-full bg-mushroom px-3 py-1 font-mono transition-colors duration-300 hover:bg-clay"
            >
              install.sh
            </a>{' '}
            does the same without Node.
          </p>
        </div>
        <div className="rounded-3xl border border-stone bg-forest p-8 text-stone shadow-[0_25px_50px_-12px_rgba(45,58,49,0.15)]">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 text-xs uppercase tracking-widest text-white/50">
            <Terminal className="h-4 w-4" strokeWidth={1.5} /> terminal
          </div>
          <pre className="mt-6 overflow-x-auto text-sm leading-relaxed">
            <code>{`$ npm install -g forge-omix
$ forge-omix

[forge-omix] Pulling image ghcr.io/…
[forge-omix] Provisioning ~/.forge-omix…
✔ Container healthy → http://localhost:8080`}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-stone py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-forest/60 md:flex-row">
        <p className="font-serif text-base text-forest">
          forge<em className="italic text-sage">@</em>omix
        </p>
        <p>Grown with care · MIT · Self-hosted first</p>
        <a href="https://github.com/marvel-254/forge-omix" className="transition-colors duration-300 hover:text-terracotta">
          GitHub
        </a>
      </div>
    </footer>
  )
}

export function App() {
  return (
    <div className="min-h-screen bg-alabaster font-sans text-forest">
      <Grain />
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Install />
      </main>
      <Footer />
    </div>
  )
}
