'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { supabase, Service } from '@/lib/supabase'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import Calendar from 'react-calendar'

type Step = 1 | 2 | 3 | 4

export default function BookingPage() {
  const t = useTranslations()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  // Load services on mount
  useEffect(() => {
    loadServices()
  }, [])

  // Load available times when date is selected
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableTimes(selectedDate, selectedService.duration_minutes)
    }
  }, [selectedDate, selectedService])

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name_en')
    
    if (!error && data) {
      setServices(data)
    }
  }

  const loadAvailableTimes = async (date: Date, duration: number) => {
    setLoading(true)
    
    // Get working hours for this day
    const dayOfWeek = date.getDay()
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_open', true)
      .single()
    
    if (!workingHours) {
      setAvailableTimes([])
      setLoading(false)
      return
    }

    // Get existing appointments for this date
    const dateStr = format(date, 'yyyy-MM-dd')
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, service_id')
      .eq('appointment_date', dateStr)
      .in('status', ['pending', 'approved'])

    // Get blocked times
    const { data: blocked } = await supabase
      .from('blocked_times')
      .select('*')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)

    // Generate time slots
    const slots = generateTimeSlots(
      workingHours.start_time,
      workingHours.end_time,
      duration,
      appointments || [],
      blocked || []
    )

    setAvailableTimes(slots)
    setLoading(false)
  }

  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    duration: number,
    bookedAppointments: any[],
    blockedTimes: any[]
  ): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMin < endMin)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      
      // Check if this slot is available
      const isBooked = bookedAppointments.some(apt => apt.appointment_time === timeStr)
      const isBlocked = blockedTimes.some(bt => {
        if (bt.all_day) return true
        if (bt.start_time && bt.end_time) {
          return timeStr >= bt.start_time && timeStr < bt.end_time
        }
        return false
      })
      
      if (!isBooked && !isBlocked) {
        slots.push(timeStr)
      }
      
      // Increment by duration
      currentMin += duration
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60)
        currentMin = currentMin % 60
      }
    }
    
    return slots
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    
    setLoading(true)
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        service_id: selectedService.id,
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        notes: formData.notes,
        status: 'pending'
      })
      .select()
      .single()
    
    if (!error && data) {
      // Send notification email
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_booking',
          appointment: data,
          service: selectedService
        })
      })
      
      setCurrentStep(4)
    }
    
    setLoading(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-medium">{t('booking.selectService')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service)
                    setCurrentStep(2)
                  }}
                  className="p-6 text-left border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h3 className="text-lg font-medium mb-2">{service.name_en}</h3>
                  <p className="text-sm text-gray-600 mb-4">{service.description_en}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{service.duration_minutes} {t('services.minutes')}</span>
                    {service.price && <span>${service.price}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-medium">{t('booking.selectDate')}</h2>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('common.back')}
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <Calendar
                onChange={(value) => setSelectedDate(value as Date)}
                value={selectedDate}
                minDate={new Date()}
                maxDate={addDays(new Date(), 60)}
                className="w-full border-0"
              />
            </div>
            
            {selectedDate && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('booking.selectTime')}</h3>
                {loading ? (
                  <p className="text-gray-500">{t('common.loading')}</p>
                ) : availableTimes.length === 0 ? (
                  <p className="text-gray-500">{t('booking.noAvailability')}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time)
                          setCurrentStep(3)
                        }}
                        className="py-3 px-4 text-center border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-medium">{t('booking.step3')}</h2>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('common.back')}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('booking.yourName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('booking.yourEmail')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('booking.yourPhone')} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('booking.additionalNotes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.email || !formData.phone || loading}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {loading ? t('common.loading') : t('booking.confirmBooking')}
              </button>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="text-center space-y-6 py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-medium">{t('booking.bookingSuccess')}</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              {t('booking.bookingSuccessMessage')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.bookNow')}
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('common.title')}</h1>
          <div className="flex justify-center items-center space-x-2 text-sm text-gray-600">
            <span>{t('location.inside')}</span>
            <span>•</span>
            <span>{t('location.address')}</span>
          </div>
        </div>
        
        {currentStep < 4 && (
          <div className="flex justify-center mb-8">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'mr-4' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
