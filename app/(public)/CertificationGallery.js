"use client";

import { useState, useEffect } from "react";
import { Award, X, ArrowUpRight } from "lucide-react";

export default function CertificationGallery({ certifications }) {
  const [activeCert, setActiveCert] = useState(null);

  useEffect(() => {
    if (activeCert) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [activeCert]);

  if (!certifications || certifications.length === 0) {
    return <p className="text-gray-500 font-medium">Belum ada sertifikasi yang dipublikasikan.</p>;
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <Award className="w-6 h-6 text-gray-400" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Licenses & Certifications</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <div 
            key={cert.id} 
            onClick={() => setActiveCert(cert)}
            className="group flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative cursor-pointer"
          >
            {/* THUMBNAIL SERAGAM (Rasio 4:3, Gambar di-cover agar rapi) */}
            <div className="w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-100">
              {cert.image_urls && cert.image_urls.length > 0 ? (
                <img 
                  src={cert.image_urls[0]} 
                  alt={cert.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">Tanpa Gambar</div>
              )}
            </div>

            {/* Info Singkat */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{cert.title}</h3>
              <p className="text-blue-600 font-bold text-sm">{cert.issuer}</p>
              <p className="text-gray-500 font-medium text-sm mt-1">{cert.date_issued}</p>
            </div>

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm">
              <ArrowUpRight className="w-4 h-4 text-gray-900" />
            </div>
          </div>
        ))}
      </div>

      {/* POP-UP MODAL DETAIL SERTIFIKASI */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div onClick={() => setActiveCert(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" />
          
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-gray-100">
              <div className="pr-8">
                <h3 className="font-extrabold text-2xl sm:text-3xl text-gray-900">{activeCert.title}</h3>
                <p className="text-blue-600 font-bold text-lg mt-2">{activeCert.issuer} • <span className="text-gray-500 font-medium">{activeCert.date_issued}</span></p>
              </div>
              <button onClick={() => setActiveCert(null)} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8 flex-1">
              {/* GAMBAR FULL (TIDAK DIPOTONG) */}
              {activeCert.image_urls && activeCert.image_urls.length > 0 && (
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar mb-8 pb-4">
                  {activeCert.image_urls.map((img, idx) => (
                    <img key={idx} src={img} alt={`Sertifikat ${idx + 1}`} className="max-h-[500px] w-auto shrink-0 snap-center rounded-xl border border-gray-200 object-contain shadow-sm" />
                  ))}
                </div>
              )}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">{activeCert.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}