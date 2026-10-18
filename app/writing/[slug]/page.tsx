import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReadingProgress from '@/components/ReadingProgress';
import CopyLinkButton from '@/components/CopyLinkButton';
import EscapeNav from '@/components/EscapeNav';
import LiquidSecondaryButton from '@/components/ui/liquid-button';
import { getArticles, getArticleBySlug } from '@/lib/data';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const articles = getArticles();
  return articles.map((a) => ({
    slug: a.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found — Studio' };

  return {
    title: `${article.title} — Studio`,
    description: article.excerpt,
    alternates: {
      canonical: `/writing/${article.slug}`,
    },
  };
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    return tok;
  });
}

function renderArticleBlocks(blocks: string[]) {
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type;
    elements.push(
      <ListTag key={`list-${elements.length}`}>
        {currentList.items.map((item, idx) => (
          <li key={idx}>{parseInlineFormatting(item)}</li>
        ))}
      </ListTag>
    );
    currentList = null;
  };

  blocks.forEach((block, idx) => {
    if (block.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`}>
          {parseInlineFormatting(block.replace('### ', ''))}
        </h3>
      );
      return;
    }

    const numMatch = block.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      if (currentList && currentList.type !== 'ol') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numMatch[1]);
      return;
    }

    const bulletMatch = block.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      if (currentList && currentList.type !== 'ul') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    flushList();
    elements.push(<p key={`p-${idx}`}>{parseInlineFormatting(block)}</p>);
  });

  flushList();
  return elements;
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const allArticles = getArticles();
  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
  const nextArticle = allArticles[(currentIndex + 1) % allArticles.length];

  return (
    <>
      <ReadingProgress />
      <EscapeNav to="/writing" />

      <article className="article-reader">
        <Link href="/writing" className="case-study__back" data-cursor="read">
          ← Back to all writing
        </Link>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className="article-reader__meta" style={{ marginBottom: 0 }}>
            <span>{article.date}</span>
            <span>•</span>
            <span className="tag-pill">{article.tag}</span>
            <span>•</span>
            <span>{article.read}</span>
          </div>

          <CopyLinkButton
            label="🔗 Copy Article Link"
            toastMessage="Article link copied to clipboard!"
          />
        </div>

        <h1 className="article-reader__title">{article.title}</h1>
        <p className="article-reader__excerpt">{article.excerpt}</p>

        <div className="article-reader__body">
          {renderArticleBlocks(article.body)}
        </div>

        <div
          className="case-study__callout"
          style={{ marginTop: '56px', borderLeftColor: 'var(--moss)' }}
        >
          <h3>Share or Discuss</h3>
          <p>
            Enjoyed this note? Feel free to share with your team or send your
            perspective directly to{' '}
            <Link
              href="/contact"
              style={{ textDecoration: 'underline', color: 'var(--clay)' }}
            >
              hello@studio.example
            </Link>
            .
          </p>
        </div>

        <nav className="case-study__nav" style={{ marginTop: '48px' }}>
          <LiquidSecondaryButton href="/writing" data-cursor="read">
            All Writing
          </LiquidSecondaryButton>
          <div className="next-nav-item">
            <Link
              href={`/writing/${nextArticle.slug}`}
              className="btn btn--primary"
              data-cursor="read"
              aria-label={`Next note: ${nextArticle.title}`}
            >
              Next →
            </Link>
            <div className="next-hover-preview" aria-hidden="true">
              <span className="next-hover-preview__label">
                Next Note • {nextArticle.read}
              </span>
              <span className="next-hover-preview__title">
                {nextArticle.title}
              </span>
            </div>
          </div>
        </nav>
      </article>
    </>
  );
}
