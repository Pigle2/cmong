import ChatPageClient from './client'

interface ChatPageProps {
  searchParams: Promise<{ seller?: string; service?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams
  return <ChatPageClient sellerId={params.seller} serviceId={params.service} />
}
