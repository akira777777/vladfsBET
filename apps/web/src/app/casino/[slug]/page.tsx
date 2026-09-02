import { PlayTable } from "./play-table";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlayTable slug={slug} />;
}
