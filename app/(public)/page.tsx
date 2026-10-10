import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Download, Mail, Phone } from "lucide-react"; 
import ProjectGallery from "./ProjectGallery";
import ExperienceGallery from "./ExperienceGallery"; 
import CertificationGallery from "./CertificationGallery";

export const revalidate = 0; 

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  // --- TARIK DATA ---
  const { data: profile } = await supabase.from("v2_profile").select("*").limit(1).maybeSingle();
  const safeProfile = profile || { full_name: "Loading...", headline: "...", summary: "...", profile_image_url: "", banner_image_url: "" };
  
  const { data: projectsData } = await supabase.from("v2_projects").select("*").order("order_index", { ascending: true });
  const projects = projectsData || [];
  
  const { data: skillsData } = await supabase.from("v2_skills").select("*").order("order_index", { ascending: true });
  const skills = skillsData || [];
  
  const { data: expData } = await supabase.from("v2_experiences").select("*").order("order_index", { ascending: true });
  const experiences = expData || [];

  const { data: certData } = await supabase.from("v2_certifications").select("*").order("order_index", { ascending: true });
  const certifications = certData || [];

  const workExperiences = experiences.filter(exp => exp.category === 'Work Experience' || !exp.category);
  const leadershipExperiences = experiences.filter(exp => exp.category === 'Leadership Experience');

  return (
    <main id="profile" className="min-h-screen bg-gray-50 text-gray-900 selection:bg-black selection:text-white font-sans relative">
      
      {/* --- FLOATING NAVBAR YANG DISEMPURNAKAN --- */}
      <nav className="fixed bottom-5 sm:bottom-auto sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[92vw] sm:w-max max-w-md sm:max-w-xl">
        <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 bg-white/80 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-black/10 rounded-full text-xs sm:text-sm font-bold text-gray-600">
          <a href="#profile" className="px-3 py-1.5 hover:bg-gray-900 hover:text-white rounded-full transition-all text-center">Top</a>
          <a href="#projects" className="px-3 py-1.5 hover:bg-gray-900 hover:text-white rounded-full transition-all text-center">Projects</a>
          <a href="#experience" className="px-3 py-1.5 hover:bg-gray-900 hover:text-white rounded-full transition-all text-center">Exp</a>
          <a href="#certifications" className="px-3 py-1.5 hover:bg-gray-900 hover:text-white rounded-full transition-all text-center">Licenses</a>
          <a href="#contact" className="px-3 py-1.5 hover:bg-gray-900 hover:text-white rounded-full transition-all text-center">Contact</a>
        </div>
      </nav>

      {/* Banner */}
      <div className="relative w-full bg-gray-900 flex overflow-hidden">
        {safeProfile.banner_image_url ? (
          <img src={safeProfile.banner_image_url} alt="Profile Banner" className="w-full h-auto object-cover object-center block" />
        ) : (
          <div className="w-full aspect-[4/1]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/90 via-transparent to-transparent"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-20">
        
        {/* Profile Section */}
        <div className="relative mb-10">
          <div className="relative -mt-16 sm:-mt-24 z-10 inline-block">
            {safeProfile.profile_image_url && (
              <img src={safeProfile.profile_image_url} alt={safeProfile.full_name} className="w-32 h-32 sm:w-44 sm:h-44 rounded-full object-cover object-center border-4 sm:border-8 border-gray-50 shadow-lg bg-white" />
            )}
          </div>
          <div className="mt-4 sm:mt-5 z-10 relative">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">{safeProfile.full_name}</h1>
            <p className="text-lg sm:text-xl font-medium text-gray-600 mt-2">{safeProfile.headline}</p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a href="/cv.pdf" download="CV_Muhammad_Zidan.pdf" className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-sm active:scale-95">
                <Download className="w-4 h-4" /> Download CV
              </a>
              <a href="https://linkedin.com/in/linkedin-anda" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#0A66C2] border border-[#0A66C2] text-sm font-bold rounded-full hover:bg-blue-50 transition-all shadow-sm active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Connect with Me
              </a>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 max-w-3xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Professional Summary</h2>
          <p className="text-gray-800 leading-relaxed text-lg font-medium whitespace-pre-wrap">{safeProfile.summary}</p>
        </div>
        
        {/* Projects */}
        <div id="projects" className="mt-16 border-t border-gray-200 pt-16 scroll-mt-24">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Selected Works & Projects</h2>
          <ProjectGallery projects={projects} />
        </div>

        {/* Skills */}
        <div className="bg-gray-900 rounded-3xl p-6 md:p-8 mt-12 shadow-lg text-white">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Expertise & Skills</h2>
          <div className="flex flex-wrap gap-3">
            {skills.length === 0 ? <p className="text-gray-400 text-sm">Belum ada skill.</p> : skills.map((skill) => (
              <span key={skill.id} className="px-4 py-2 bg-gray-800 text-gray-200 text-sm font-medium rounded-xl border border-gray-700 hover:border-gray-500 transition-colors cursor-default">
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div id="experience" className="mt-16 border-t border-gray-200 pt-16 scroll-mt-24">
          <ExperienceGallery 
            workExperiences={workExperiences} 
            leadershipExperiences={leadershipExperiences} 
          />
        </div>

        {/* Certifications */}
        <div id="certifications" className="mt-16 border-t border-gray-200 pt-16 scroll-mt-24">
          <CertificationGallery certifications={certifications} />
        </div>
        
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16 border-t border-gray-800 pb-32 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Let's Build Something Great</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl">
            Tertarik untuk berkolaborasi, berdiskusi soal data, atau punya tawaran menarik? Jangan ragu untuk menyapa saya.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a href="mailto:jidan1307@gmail.com" className="flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 text-sm font-bold rounded-full hover:bg-gray-100 transition-all active:scale-95 shadow-lg">
              <Mail className="w-5 h-5" /> Email Me
            </a>
            <a href="https://wa.me/6285711457917" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-8 py-3.5 bg-[#25D366] text-white text-sm font-bold rounded-full hover:bg-[#20bd5a] transition-all active:scale-95 shadow-lg">
               <Phone className="w-5 h-5" /> WhatsApp
            </a>
          </div>
          <div className="w-24 h-1 bg-gray-800 rounded-full mb-8"></div>
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} Muhammad Zidan. All rights reserved.
          </p>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        html { scroll-behavior: smooth; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}