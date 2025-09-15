import SellerLayout from '@/components/SellerLayout'

export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SellerLayout>{children}</SellerLayout>
}
