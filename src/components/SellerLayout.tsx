'use client'

import React from 'react'
import SellerSidebar from './SellerSidebar'

type SellerLayoutProps = {
  children: React.ReactNode
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - ทางซ้าย */}
      <SellerSidebar />
      
      {/* Main Content - ทางขวา */}
      <main className="flex-1 lg:ml-72">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
