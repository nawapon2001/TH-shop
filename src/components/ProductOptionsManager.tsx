// Component สำหรับจัดการตัวเลือกสินค้าพร้อมราคา
'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'

type ProductOptionValue = {
  value: string
  price: number
  priceType: 'add' | 'replace'
}

type ProductOption = {
  name: string
  values: ProductOptionValue[]
}

interface ProductOptionsManagerProps {
  options: ProductOption[]
  basePrice: number
  onChange: (options: ProductOption[]) => void
}

export default function ProductOptionsManager({ 
  options, 
  basePrice = 0, 
  onChange 
}: ProductOptionsManagerProps) {
  const [editingOption, setEditingOption] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<{optionIndex: number, valueIndex: number} | null>(null)

  const addNewOption = () => {
    const newOption: ProductOption = {
      name: 'ตัวเลือกใหม่',
      values: [{ value: 'ค่าเริ่มต้น', price: 0, priceType: 'add' }]
    }
    onChange([...options, newOption])
    setEditingOption(options.length)
  }

  const updateOptionName = (index: number, name: string) => {
    const updated = [...options]
    updated[index].name = name
    onChange(updated)
  }

  const addValueToOption = (optionIndex: number) => {
    const updated = [...options]
    updated[optionIndex].values.push({
      value: 'ค่าใหม่',
      price: 0,
      priceType: 'add'
    })
    onChange(updated)
  }

  const updateValue = (
    optionIndex: number, 
    valueIndex: number, 
    field: keyof ProductOptionValue, 
    value: any
  ) => {
    const updated = [...options]
    updated[optionIndex].values[valueIndex] = {
      ...updated[optionIndex].values[valueIndex],
      [field]: value
    }
    onChange(updated)
  }

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...options]
    updated[optionIndex].values.splice(valueIndex, 1)
    
    // ถ้าไม่มีค่าเหลือ ให้ลบตัวเลือกทั้งหมด
    if (updated[optionIndex].values.length === 0) {
      updated.splice(optionIndex, 1)
    }
    
    onChange(updated)
  }

  const removeOption = (optionIndex: number) => {
    const updated = [...options]
    updated.splice(optionIndex, 1)
    onChange(updated)
    setEditingOption(null)
  }

  const calculateDisplayPrice = (value: ProductOptionValue) => {
    if (value.priceType === 'replace') {
      return value.price
    } else {
      return basePrice + value.price
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">ตัวเลือกสินค้า</h3>
        <button
          type="button"
          onClick={addNewOption}
          className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          เพิ่มตัวเลือก
        </button>
      </div>

      {options.map((option, optionIndex) => (
        <div key={optionIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              {editingOption === optionIndex ? (
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                  onBlur={() => setEditingOption(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingOption(null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
              ) : (
                <h4 
                  className="text-lg font-medium text-gray-700 cursor-pointer hover:text-orange-600"
                  onClick={() => setEditingOption(optionIndex)}
                >
                  {option.name}
                  <Edit size={14} className="inline ml-2 text-gray-400" />
                </h4>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeOption(optionIndex)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {option.values.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <input
                    type="text"
                    value={value.value}
                    onChange={(e) => updateValue(optionIndex, valueIndex, 'value', e.target.value)}
                    placeholder="ชื่อตัวเลือก"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="w-32">
                  <input
                    type="number"
                    value={value.price}
                    onChange={(e) => updateValue(optionIndex, valueIndex, 'price', Number(e.target.value) || 0)}
                    placeholder="ราคา"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="w-24">
                  <select
                    value={value.priceType}
                    onChange={(e) => updateValue(optionIndex, valueIndex, 'priceType', e.target.value as 'add' | 'replace')}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="add">เพิ่ม</option>
                    <option value="replace">แทนที่</option>
                  </select>
                </div>

                <div className="w-24 text-right">
                  <span className="text-sm font-medium text-green-600">
                    ฿{calculateDisplayPrice(value).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeValue(optionIndex, valueIndex)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => addValueToOption(optionIndex)}
              className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-orange-300 hover:text-orange-500 transition-colors"
            >
              + เพิ่มตัวเลือก
            </button>
          </div>
        </div>
      ))}

      {options.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>ยังไม่มีตัวเลือกสินค้า</p>
          <p className="text-sm">คลิก &quot;เพิ่มตัวเลือก&quot; เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* แสดงข้อมูลสรุป */}
      {options.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">สรุปตัวเลือกและราคา</h4>
          <div className="text-sm text-blue-700">
            <p>ราคาหลัก: ฿{basePrice.toLocaleString()}</p>
            {options.map((option, optionIndex) => (
              <div key={optionIndex} className="mt-2">
                <strong>{option.name}:</strong>
                {option.values.map((value, valueIndex) => (
                  <span key={valueIndex} className="ml-2">
                    {value.value} (฿{calculateDisplayPrice(value).toLocaleString()})
                    {valueIndex < option.values.length - 1 && ', '}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
