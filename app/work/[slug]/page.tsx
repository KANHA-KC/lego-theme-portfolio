import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyLinkButton from '@/components/CopyLinkButton';
import EscapeNav from '@/components/EscapeNav';
import { getProjects, getProjectBySlug } from '@/lib/data';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: 'Case Study Not Found — Studio' };

  return {
    title: `${project.title} — Case Study — Studio`,
    description: project.thesis,
    alternates: {
      canonical: `/work/${project.slug}`,
    },
  };
}

import CaseStudyViewer from '@/components/CaseStudyViewer';

export default async function ProjectCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const allProjects = getProjects();
  const currentIndex = allProjects.findIndex((p) => p.slug === project.slug);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length];

  return <CaseStudyViewer project={project} nextProject={nextProject} />;
}
