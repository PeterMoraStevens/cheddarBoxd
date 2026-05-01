import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Star, Users, BookOpen, ArrowRight } from "lucide-react";
import Marquee from "react-fast-marquee";

const FEATURES = [
  {
    icon: Star,
    title: "Rate & Review",
    desc: "Rate snacks and write the review humanity deserves.",
  },
  {
    icon: Users,
    title: "Follow Friends",
    desc: "See what your circle is snacking on. Discover through people you trust.",
  },
  {
    icon: BookOpen,
    title: "Build Collections",
    desc: "Cheddarboxd has everything. Your want-to-try list. Your favorites shelf. Your snack journey all stored for you.",
  },
];

const TAGLINES = [
  "For the snack-obsessed",
  "Rate responsibly",
  "Your friends are eating this right now",
  "Powered by curiosity",
  "Fueled by cheese",
  "Find the best snacks",
  "Put your friends on to something new",
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-[color:var(--bg)] min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 neo-card px-3 py-1.5 mb-6 text-sm font-semibold uppercase tracking-widest">
            <span>Over {(4).toLocaleString()}M+ items</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
            Track&nbsp;snacks.
            <br />
            <span className="text-primary">Share</span>&nbsp;favorites.
            <br />
            See what&nbsp;your&nbsp;friends are eating.
          </h1>

          <p className="text-lg sm:text-xl text-[color:var(--text-muted)] max-w-xl mb-8 leading-relaxed">
            CheddarBoxd is the best place for snack lovers. Rate what you eat,
            follow friends, and discover your next obsession.
          </p>

          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href="/feed">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Go to your feed
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  Get started
                  <ArrowRight size={16} />
                </Button>
              </Link>
            )}
            <Link href="/search">
              <Button variant="secondary" size="lg">
                Explore snacks
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="border-y-2 border-[color:var(--border)] bg-primary overflow-hidden py-3">
        <Marquee className="h-8">
          {[...TAGLINES, ...TAGLINES].map((t, i) => (
            <span
              key={i}
              className="text-md font-black uppercase tracking-widest text-ink flex items-center gap-4 mx-2"
            >
              {t}
              <span className="text-ink font-black">*</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black uppercase tracking-tight mb-12 text-center">
          Why CheddarBoxd?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="neo-card p-6">
              <div className="w-12 h-12 bg-primary border-2 border-[color:var(--border)] flex items-center justify-center mb-4">
                <f.icon size={22} className="text-ink" />
              </div>
              <h3 className="font-black text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="border-t-2 border-[color:var(--border)] bg-[color:var(--muted)]">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready to start your snack diary?
          </h2>
          <p className="text-[color:var(--text-muted)] mb-8 text-lg">
            It&apos;s free. Always.
          </p>
          {user ? (
            <Link href="/feed">
              <Button
                variant="primary"
                size="lg"
                className="flex items-center gap-2 mx-auto"
              >
                Go to your feed
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="primary" size="lg">
                Sign in with Google
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
