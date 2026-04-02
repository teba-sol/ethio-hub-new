"use client";
import { ArtisanEditProductPage } from '@/pages/artisan/ArtisanEditProductPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ArtisanEditProductPage params={params} />;
}
