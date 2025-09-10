'use client'

import React, { useEffect } from 'react'

export default function AdminSellerPage() {
	// Update document title
	useEffect(() => {
		document.title = 'จัดการร้านค้า | TH-THAI SHOP'
	}, [])

	return (
		<div className="p-4">
			<h1 className="text-lg font-semibold">Seller Admin</h1>
			<p className="text-sm text-slate-500">Placeholder page for seller admin area.</p>
		</div>
	)
}

