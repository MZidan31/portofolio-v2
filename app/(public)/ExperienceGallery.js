"use client";

import { useState, useEffect } from "react";
import { Briefcase, Users, X, ArrowUpRight } from "lucide-react";

export default function ExperienceGallery({ workExperiences, leadershipExperiences }) {
  const [activeExp, setActiveExp] = useState(null);

  // Mengunci scroll layar belakang saat pop-up terbuka
  useEffect(() => {
    if (activeExp) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [activeExp]);

  // Fungsi template untuk me-render daftar pengalaman
  const renderExperienceList = (experiences) => {
    if (!experiences || experiences.length === 0) {
      return <p className="text-gray-500 font-medium">Belum ada pengalaman di kategori ini.</p>;
    }
    
    return (
      <div className="space-y-6">
        {experiences.map((exp) => (
          <div 
            key={exp.id} 
            onClick={() => setActiveExp(exp)}
            className="group flex flex-col md:flex-row gap-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative items-start"
          >
            {/* Thumbnail (Hanya menampilkan gambar pertama) */}
            {exp.image_urls && exp.image_urls.length > 0 && (
              <div className="w-full md:w-48 h-40 md:h-32 shrink-0 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <img 
                  src={exp.image_urls[0]} 
                  alt={exp.company} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            )}
            
            {/* Informasi Teks */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{exp.role}</h3>
                  <p className="text-blue-600 font-bold mt-1">{exp.company}</p>
                </div>
                <div className="shrink-0">
                  <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-full">
                    {exp.period}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 font-medium line-clamp-2 md:line-clamp-3">
                {exp.description}
              </p>
            </div>

            {/* Ikon panah di pojok kanan atas saat di-hover */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
              <ArrowUpRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Kategori: Work Experience */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <Briefcase className="w-6 h-6 text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Work Experience</h2>
        </div>
        {renderExperienceList(workExperiences)}
      </div>

      {/* Kategori: Leadership & Organization */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-6 h-6 text-gray-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Leadership & Organization</h2>
        </div>
        {renderExperienceList(leadershipExperiences)}
      </div>

      {/* --- POP-UP MODAL DETAIL PENGALAMAN --- */}
      {activeExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Latar Belakang Gelap (Bisa di-klik untuk tutup) */}
          <div onClick={() => setActiveExp(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" />
          
          {/* Kontainer Modal */}
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-gray-100">
              <div className="pr-8">
                <h3 className="font-extrabold text-2xl sm:text-3xl text-gray-900">{activeExp.role}</h3>
                <p className="text-blue-600 font-bold text-lg mt-2">{activeExp.company} • <span className="text-gray-500 font-medium">{activeExp.period}</span></p>
              </div>
              <button onClick={() => setActiveExp(null)} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8 flex-1">
              
              {/* Galeri Gambar Lengkap */}
              {activeExp.image_urls && activeExp.image_urls.length > 0 && (
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar mb-8 pb-4">
                  {activeExp.image_urls.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Dokumentasi ${idx + 1}`} 
                      className="h-64 sm:h-80 w-auto shrink-0 snap-center rounded-2xl border border-gray-200 object-contain bg-gray-50 shadow-sm" 
                    />
                  ))}
                </div>
              )}

              {/* Deskripsi Lengkap */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {activeExp.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}