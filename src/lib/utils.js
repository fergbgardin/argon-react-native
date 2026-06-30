import { format, parseISO, isSameMonth, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateShort(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatMonthYear(date) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM/yy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function currentMonthRange() {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function isCurrentMonth(date) {
  if (!date) return false
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isSameMonth(d, new Date())
  } catch {
    return false
  }
}

export function whatsappLink(phone) {
  if (!phone) return '#'
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function calcComissao(valorTotal, studio) {
  if (!studio || !valorTotal) return 0
  if (studio.tipo_cobranca === 'porcentagem') {
    return (valorTotal * (studio.valor_padrao || 0)) / 100
  }
  return studio.valor_padrao || 0
}

export function getBirthdaysThisMonth(clients) {
  if (!clients) return []
  const now = new Date()
  return clients.filter((c) => {
    if (!c.nascimento) return false
    try {
      const bday = parseISO(c.nascimento)
      return bday.getMonth() === now.getMonth()
    } catch {
      return false
    }
  })
}
