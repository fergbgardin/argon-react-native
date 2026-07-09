import { Wrench } from 'lucide-react'

export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="max-w-sm text-center space-y-4">
        <Wrench className="w-10 h-10 mx-auto text-primary" />
        <h1 className="text-xl font-semibold text-white">
          Sistema em manutenção
        </h1>
        <p className="text-muted">
          Estamos fazendo uma atualização importante. Voltamos até{' '}
          <strong className="text-white">segunda-feira, 13/07</strong>.
        </p>
      </div>
    </div>
  )
}
