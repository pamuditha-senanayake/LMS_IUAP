import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-transparent">
      <main className="flex flex-col items-center gap-8 max-w-3xl glass-card rounded-3xl p-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
          Welcome to LMS
        </h1>
        <p className="text-lg md:text-xl text-slate-300">
          A premium full-stack platform built with Next.js and Spring Boot. Experience seamless, secure authentication and a dynamic, fluid user interface.
        </p>

        <div className="flex gap-6 mt-8">
          <Link
            className="rounded-full bg-indigo-500 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all outline-none text-white px-8 py-3 font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            href="/login"
          >
            Login to your account
          </Link>
          <Link
            className="rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all text-white outline-none px-8 py-3 font-semibold"
            href="/register"
          >
            Create an account
          </Link>
        </div>
      </main>
    </div>
  );
}
