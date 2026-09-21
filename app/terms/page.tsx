import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { businessConfig } from "@/lib/business-config";
import { getTermsDocument, type TermsBlock } from "@/lib/terms";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${businessConfig.company.name}`,
  description: `Terms & Conditions for ${businessConfig.company.name}.`,
};

function TermsBlocks({ blocks }: { blocks: TermsBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "list") {
      return (
        <ul
          key={`list-${index}`}
          className="my-6 list-disc space-y-3 pl-6 marker:text-blue-600 sm:pl-8"
        >
          {block.items.map((item) => (
            <li key={item} className="pl-1 leading-7 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="my-5 leading-8 text-slate-700">
        {block.text}
      </p>
    );
  });
}

export default async function TermsPage() {
  const terms = await getTermsDocument();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Guidestone home">
            <Image
              src={businessConfig.assets.logoPath}
              alt={`${businessConfig.company.name} logo`}
              width={1536}
              height={1024}
              className="h-14 w-20 rounded-lg object-cover object-center"
              sizes="80px"
              priority
            />
            <span className="hidden font-bold sm:inline">{businessConfig.company.name}</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-blue-200 transition hover:text-white"
          >
            ← Back to website
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-navy px-5 pb-16 pt-12 text-white sm:px-8 sm:pb-20 sm:pt-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              {terms.companyName}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {terms.title}
            </h1>
            <p className="mt-5 text-sm font-semibold text-slate-300">
              {terms.lastUpdated}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <article className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12 lg:px-14">
            <div className="border-b border-slate-200 pb-6 text-base sm:text-lg">
              <TermsBlocks blocks={terms.introduction} />
            </div>

            <div className="divide-y divide-slate-200">
              {terms.sections.map((section) => (
                <section
                  key={section.number}
                  id={`section-${section.number}`}
                  className="scroll-mt-8 py-8 sm:py-10"
                >
                  <h2 className="text-xl font-extrabold tracking-[-0.02em] text-navy sm:text-2xl">
                    {section.heading}
                  </h2>
                  <div className="mt-5 text-base sm:text-[1.05rem]">
                    <TermsBlocks blocks={section.blocks} />
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <footer className="bg-navy px-5 py-8 text-center text-sm text-slate-400 sm:px-8">
        <p>© {new Date().getFullYear()} {businessConfig.company.legalName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
