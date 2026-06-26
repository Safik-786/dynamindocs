import Link from "next/link";
import Image from 'next/image';
import previewImage from '@/assets/image.png';
import { Great_Vibes } from 'next/font/google';

const fancyCursive = Great_Vibes({ 
  subsets: ['latin'],
  weight: '400',
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-mesh font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 shadow h-8 rounded-lg bg-green-950 flex items-center justify-center text-white font-black ">
            D
          </div>
          <span className="text-xl uppercase font-black tracking-tight bg-gradient-to-r from-green-400 to-green-700 text-transparent bg-clip-text">
            DDOCS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Log in
          </Link>
          <Link href="/register" className="text-sm font-medium bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center relative z-10">
        
        <div className="animate-fade-in-up flex flex-col items-center">
          <a href="#features" className="group inline-flex items-center gap-3 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 font-medium mb-8 transition-colors border border-slate-200">
            <div className="flex -space-x-3">
              <img className="w-8 h-8 rounded-full border-2 border-slate-100 object-cover shadow-sm relative z-[4]" src="https://i.pravatar.cc/100?img=1" alt="User 1" />
              <img className="w-8 h-8 rounded-full border-2 border-slate-100 object-cover shadow-sm relative z-[3]" src="https://i.pravatar.cc/100?img=5" alt="User 2" />
              <img className="w-8 h-8 rounded-full border-2 border-slate-100 object-cover shadow-sm relative z-[2]" src="https://i.pravatar.cc/100?img=8" alt="User 3" />
              <img className="w-8 h-8 rounded-full border-2 border-slate-100 object-cover shadow-sm relative z-[1]" src="https://i.pravatar.cc/100?img=12" alt="User 4" />
            </div>
            <span className="ml-1">Real-time collaboration is now live</span>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <h1 className={`max-w-4xl text-6xl md:text-8xl text-slate-900 font-bold leading-tight mb-6 [word-spacing:0.1em] ${fancyCursive.className}`}>
            Write together, <br className="hidden md:block"/>
            <span className="text-primary font-extrabold">create faster.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            A beautiful, collaborative workspace for your team. Share ideas, edit documents in real-time, and build the future together with DDOCS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/register" 
              className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30"
            >
              Get Started for Free
            </Link>
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 glass-panel text-slate-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-white/80 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Decorative Graphic / Mockup Placeholder */}
        <div className="mt-20 w-full max-w-5xl animate-float relative">
          <div className="absolute inset-0 bg-primary-500 opacity-10 blur-3xl rounded-full"></div>
          <div className="relative glass-panel rounded-2xl border border-white/40 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center bg-white/40 p-2">
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/20 shadow-inner">
              <Image 
                src={previewImage} 
                alt="Collaborative Editor Preview" 
                fill
                className="object-cover"
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
