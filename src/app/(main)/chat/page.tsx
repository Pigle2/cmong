import ChatPageClient from './client'

interface ChatPageProps {
  searchParams: { seller?: string; service?: string }
}

export default function ChatPage({ searchParams }: ChatPageProps) {
  return <ChatPageClient sellerId={searchParams.seller} serviceId={searchParams.service} />
}
