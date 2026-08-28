"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    })

    if (result?.error) {
      setError("Email ou senha inválidos.")
      setLoading(false)
      return
    }

    window.location.assign(result?.url ?? "/")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-[1fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-orange-500 p-10 text-slate-950 md:flex">
          <div className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="rounded-lg bg-slate-950 px-2 py-1 text-lg text-orange-400">S</span>
            StockApp Fashion
          </div>
          <div>
            <ShieldCheck className="mb-5 h-12 w-12" />
            <h1 className="text-4xl font-bold leading-tight">Controle sua operação com clareza.</h1>
            <p className="mt-4 max-w-sm text-slate-900/75">Acesse estoque, vendas e indicadores da sua loja em um só lugar.</p>
          </div>
          <p className="text-sm text-slate-900/60">Ambiente protegido</p>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mb-8 md:hidden">
            <div className="mb-6 flex items-center gap-3 font-semibold tracking-tight"><span className="rounded-lg bg-orange-500 px-2 py-1 text-lg text-slate-950">S</span>StockApp Fashion</div>
          </div>
          <p className="text-sm font-medium text-orange-400">Bem-vindo de volta</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Entrar no sistema</h2>
          <p className="mt-2 text-sm text-slate-400">Use suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-200">Email
              <span className="relative mt-2 block"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-10 py-2.5 text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" placeholder="voce@empresa.com" /></span>
            </label>
            <label className="block text-sm font-medium text-slate-200">Senha
              <span className="relative mt-2 block"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-10 py-2.5 text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" placeholder="Sua senha" /></span>
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Entrando..." : "Entrar"}</button>
          </form>
        </section>
      </div>
    </main>
  )
}
