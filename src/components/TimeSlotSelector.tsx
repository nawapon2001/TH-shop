'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface TimeSlot {
  date: string
  startTime: string
  endTime: string
  available: number
  booked: number
  price: number
}

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[]
  onSelectSlot: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot
}

export default function TimeSlotSelector({ timeSlots, onSelectSlot, selectedSlot }: TimeSlotSelectorProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Get unique dates from time slots
  const availableDates = Array.from(new Set(timeSlots.map(slot => slot.date))).sort()

  // Get time slots for selected date
  const slotsForDate = selectedDate 
    ? timeSlots.filter(slot => slot.date === selectedDate)
    : []

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if slot is available
  const isSlotAvailable = (slot: TimeSlot) => {
    return slot.available > slot.booked
  }

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
  }

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    if (isSlotAvailable(slot)) {
      onSelectSlot(slot)
    }
  }

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  // Get dates for current week view
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const weekDates = getWeekDates()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">เลือกวันที่</h3>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-lg border border-orange-200 hover:bg-orange-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex gap-2 overflow-x-auto">
            {weekDates.map(date => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap ${
                  selectedDate === date
                    ? 'bg-orange-600 text-white border-orange-600'
                    : availableDates.includes(date)
                    ? 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                disabled={!availableDates.includes(date)}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-lg border border-orange-200 hover:bg-orange-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-3">เลือกเวลา</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {slotsForDate.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotSelect(slot)}
                disabled={!isSlotAvailable(slot)}
                className={`p-3 rounded-lg border text-sm ${
                  selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime
                    ? 'bg-orange-600 text-white border-orange-600'
                    : isSlotAvailable(slot)
                    ? 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{slot.startTime} - {slot.endTime}</span>
                </div>
                <div className="text-xs mt-1">
                  {isSlotAvailable(slot) 
                    ? `ว่าง ${slot.available - slot.booked}/${slot.available}`
                    : 'เต็ม'
                  }
                </div>
                <div className="text-xs font-semibold">
                  ฿{slot.price}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
