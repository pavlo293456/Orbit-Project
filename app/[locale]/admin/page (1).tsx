'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { supabase, Appointment, Service } from '@/lib/supabase'
import { format } from 'date-fns'

type AppointmentWithService = Appointment & {
  services: Service
}

export default function AdminDashboard() {
  const t = useTranslations()
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'completed'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [filter])

  const loadAppointments = async () => {
    setLoading(true)
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        services (*)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data, error } = await query
    
    if (!error && data) {
      setAppointments(data as AppointmentWithService[])
    }
    
    setLoading(false)
  }

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: Appointment['status']
  ) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
    
    if (!error) {
      // Send email notification
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: newStatus === 'approved' ? 'appointment_approved' : 'appointment_cancelled',
            appointment,
            service: appointment.services
          })
        })
      }
      
      loadAppointments()
    }
  }

  const renderAppointmentCard = (appointment: AppointmentWithService) => (
    <div
      key={appointment.id}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium mb-1">{appointment.client_name}</h3>
          <p className="text-sm text-gray-600">{appointment.services.name_en}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {t(`admin.${appointment.status}`)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{appointment.appointment_time}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>{appointment.client_email}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{appointment.client_phone}</span>
        </div>
      </div>
      
      {appointment.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">{appointment.notes}</p>
        </div>
      )}
      
      {appointment.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'approved')}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {t('admin.approve')}
          </button>
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {t('admin.reject')}
          </button>
        </div>
      )}
      
      {appointment.status === 'approved' && (
        <button
          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t('admin.markCompleted')}
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t('admin.logout')}
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {(['all', 'pending', 'approved', 'completed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? t('admin.appointments') : t(`admin.${status}`)}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">{t('admin.noAppointments')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map(renderAppointmentCard)}
          </div>
        )}
      </div>
    </div>
  )
}
