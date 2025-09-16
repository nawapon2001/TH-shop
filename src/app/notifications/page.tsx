import { Metadata } from 'next'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'การแจ้งเตือน - TH-Thai Shop',
  description: 'การแจ้งเตือนและประกาศจากแอดมิน',
}

type Announcement = {
  _id: string
  title: string
  content: string
  type: string
  isActive: boolean
  image?: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
}

async function getActiveAnnouncements(): Promise<Announcement[]> {
  const now = new Date()
  const anns = await prisma.announcement.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ]
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })

  return anns.map(a => ({
    _id: a.id.toString(),
    title: a.title,
    content: a.content,
    type: a.type,
    isActive: a.isActive,
    image: a.image || null,
    startDate: a.startDate ? a.startDate.toISOString() : null,
    endDate: a.endDate ? a.endDate.toISOString() : null,
    createdAt: a.createdAt.toISOString()
  }))
}

export default async function NotificationsPage() {
  const announcements = await getActiveAnnouncements()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">การแจ้งเตือน</h1>

          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">ยังไม่มีประกาศจากแอดมินในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ann.title}</h3>
                      <div className="text-xs text-gray-500">ประกาศจากแอดมิน • {new Date(ann.createdAt).toLocaleString('th-TH')}</div>
                    </div>
                    {ann.image && (
                      <img src={ann.image} alt={ann.title} className="w-24 h-16 object-cover rounded-md ml-4" />
                    )}
                  </div>
                  <p className="mt-3 text-gray-700 whitespace-pre-line">{ann.content}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}