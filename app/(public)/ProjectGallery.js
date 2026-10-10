"use client"; // Ini penanda bahwa komponen ini berjalan instan di browser

import { useState, useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";

export default function ProjectGallery({ projects }) {
  const [activeProject, setActiveProject] = useState(null);

  // Mengunci scroll layar belakang saat pop-up terbuka
  useEffect(() => {
    if (activeProject) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    
    return () => { document.body.style.overflow = "auto"; };
  }, [activeProject]);

  if (!projects || projects.length === 0) {
    return <p className="text-gray-500 font-medium">Belum ada karya yang dipublikasikan.</p>;
  }

  return (
    <>
      {/* MASONRY GRID LAYOUT */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => setActiveProject(project)} // Buka pop-up instan
            className="break-inside-avoid flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative group mb-6 block cursor-pointer"
          >
            {/* THUMBNAIL (GAMBAR PERTAMA) */}
            {project.image_urls && project.image_urls.length > 0 && (
              <div className="w-full bg-gray-50 overflow-hidden">
                <img 
                  src={project.image_urls[0]} 
                  alt={project.title} 
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            )}

            {/* INFO PROYEK (KARTU DEPAN) */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h3>
              <p className="text-gray-600 font-medium line-clamp-3 mb-6">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech_stack && project.tech_stack.map((tech, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-100">{tech}</span>
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm">
              <ArrowUpRight className="w-4 h-4 text-gray-900" />
            </div>
          </div>
        ))}
      </div>

      {/* --- POP-UP MODAL (TAMPIL INSTAN) --- */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Latar Belakang Gelap (Klik untuk tutup instan) */}
          <div 
            onClick={() => setActiveProject(null)} 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" 
          />
          
          {/* Kontainer Pop-Up */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Pop-Up */}
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-gray-100">
              <h3 className="font-extrabold text-2xl sm:text-3xl text-gray-900 pr-8">{activeProject.title}</h3>
              <button 
                onClick={() => setActiveProject(null)} 
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors absolute right-6 sm:right-8"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Pop-Up */}
            <div className="overflow-y-auto p-6 sm:p-8 flex-1">
              
              {/* Galeri Gambar Lengkap */}
              {activeProject.image_urls && activeProject.image_urls.length > 0 && (
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar mb-8 pb-4">
                  {activeProject.image_urls.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Dokumentasi ${idx + 1}`} 
                      className="h-64 sm:h-96 w-auto shrink-0 snap-center rounded-2xl border border-gray-200 object-contain bg-gray-50 shadow-sm" 
                    />
                  ))}
                </div>
              )}

              {/* Kategori Label */}
              <div className="flex flex-wrap gap-2 mb-6">
                {activeProject.tech_stack && activeProject.tech_stack.map((tech, index) => (
                  <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl border border-blue-100">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Deskripsi Lengkap */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {activeProject.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}