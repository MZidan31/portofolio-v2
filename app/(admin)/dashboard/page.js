"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, LayoutDashboard, User, Briefcase, Code, Star, Save, Plus, Trash2, Edit2, Image as ImageIcon, X, GripVertical, Award } from "lucide-react";
import Cropper from "react-easy-crop";

const createImage = (url) => new Promise((resolve, reject) => {
  const image = new window.Image();
  image.addEventListener("load", () => resolve(image));
  image.addEventListener("error", (error) => reject(error));
  image.setAttribute("crossOrigin", "anonymous");
  image.src = url;
});
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9));
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [cropModal, setCropModal] = useState({ isOpen: false, src: null, field: null, aspect: 1 });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [profileData, setProfileData] = useState({ full_name: "", headline: "", summary: "", profile_image_url: "", banner_image_url: "" });
  
  const [projects, setProjects] = useState([]);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectFormData, setProjectFormData] = useState({ title: "", description: "", tech_stack: "", image_urls: [] });

  const [skills, setSkills] = useState([]);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillName, setSkillName] = useState("");

  const [experiences, setExperiences] = useState([]);
  const [isExpFormOpen, setIsExpFormOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expFormData, setExpFormData] = useState({ role: "", company: "", period: "", description: "", category: "Work Experience", image_urls: [] });

  // --- STATE CERTIFICATIONS ---
  const [certifications, setCertifications] = useState([]);
  const [isCertFormOpen, setIsCertFormOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);
  const [certFormData, setCertFormData] = useState({ title: "", issuer: "", date_issued: "", description: "", image_urls: [] });

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSort = async (list, setList, tableName) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    const newList = [...list];
    const draggedItemContent = newList.splice(dragItem.current, 1)[0];
    newList.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null; dragOverItem.current = null;
    setList(newList);
    for (let i = 0; i < newList.length; i++) {
      await supabase.from(tableName).update({ order_index: i }).eq("id", newList[i].id);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase.from("v2_profile").select("*").limit(1).maybeSingle();
      if (profile) setProfileData(profile);
      const { data: projData } = await supabase.from("v2_projects").select("*").order("order_index", { ascending: true });
      if (projData) setProjects(projData);
      const { data: skillsData } = await supabase.from("v2_skills").select("*").order("order_index", { ascending: true });
      if (skillsData) setSkills(skillsData);
      const { data: expData } = await supabase.from("v2_experiences").select("*").order("order_index", { ascending: true });
      if (expData) setExperiences(expData);
      const { data: certData } = await supabase.from("v2_certifications").select("*").order("order_index", { ascending: true });
      if (certData) setCertifications(certData);
    };
    fetchData();
  }, [supabase]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const onFileSelect = (e, fieldName) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropModal({ isOpen: true, src: reader.result, field: fieldName, aspect: fieldName === "banner_image_url" ? 4 / 1 : 1 });
        setZoom(1); setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleSaveCrop = async () => {
    setUploadingImage(true);
    try {
      const croppedBlob = await getCroppedImg(cropModal.src, croppedAreaPixels);
      const filePath = `images/${cropModal.field}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("portfolio_v2").upload(filePath, croppedBlob);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from("portfolio_v2").getPublicUrl(filePath);
      setProfileData({ ...profileData, [cropModal.field]: publicUrlData.publicUrl });
    } catch (error) { alert("Error: " + error.message); } 
    finally { setUploadingImage(false); setCropModal({ isOpen: false, src: null, field: null, aspect: 1 }); }
  };

  const handleGenericImagesUpload = async (e, formData, setFormData) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImage(true);
    let uploadedUrls = [...formData.image_urls];
    for (const file of files) {
      const filePath = `images/file_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error } = await supabase.storage.from("portfolio_v2").upload(filePath, file);
      if (!error) {
        const { data } = supabase.storage.from("portfolio_v2").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }
    setFormData({ ...formData, image_urls: uploadedUrls });
    setUploadingImage(false); e.target.value = null;
  };

  const removeGenericImage = (indexToRemove, formData, setFormData) => {
    setFormData({ ...formData, image_urls: formData.image_urls.filter((_, idx) => idx !== indexToRemove) });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    await supabase.from("v2_profile").upsert({ id: 1, ...profileData });
    setLoading(false); alert("Profil berhasil diperbarui!");
  };

  // --- PROJECTS ---
  const handleOpenProjectForm = (project = null) => {
    if (project) {
      setEditingProjectId(project.id);
      setProjectFormData({ title: project.title, description: project.description, tech_stack: project.tech_stack ? project.tech_stack.join(", ") : "", image_urls: project.image_urls || [] });
    } else {
      setEditingProjectId(null); setProjectFormData({ title: "", description: "", tech_stack: "", image_urls: [] });
    }
    setIsProjectFormOpen(true);
  };
  const handleSaveProject = async (e) => {
    e.preventDefault(); setLoading(true);
    const techArray = projectFormData.tech_stack.split(",").map(item => item.trim()).filter(i => i);
    const payload = { title: projectFormData.title, description: projectFormData.description, tech_stack: techArray, image_urls: projectFormData.image_urls, order_index: editingProjectId ? undefined : projects.length };
    let error;
    if (editingProjectId) { const res = await supabase.from("v2_projects").update(payload).eq("id", editingProjectId); error = res.error; } 
    else { const res = await supabase.from("v2_projects").insert([payload]); error = res.error; }
    setLoading(false);
    if (error) alert("Gagal: " + error.message);
    else {
      setIsProjectFormOpen(false); setEditingProjectId(null);
      const { data } = await supabase.from("v2_projects").select("*").order("order_index", { ascending: true });
      if (data) setProjects(data);
    }
  };
  const handleDeleteProject = async (id) => {
    if (window.confirm("Hapus karya ini?")) { await supabase.from("v2_projects").delete().eq("id", id); setProjects(projects.filter(p => p.id !== id)); }
  };

  // --- EXPERIENCES ---
  const handleOpenExpForm = (exp = null) => {
    if (exp) {
      setEditingExpId(exp.id);
      setExpFormData({ role: exp.role, company: exp.company, period: exp.period, description: exp.description, category: exp.category || "Work Experience", image_urls: exp.image_urls || [] });
    } else {
      setEditingExpId(null); setExpFormData({ role: "", company: "", period: "", description: "", category: "Work Experience", image_urls: [] });
    }
    setIsExpFormOpen(true);
  };
  const handleSaveExperience = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...expFormData, order_index: editingExpId ? undefined : experiences.length };
    let error;
    if (editingExpId) { const res = await supabase.from("v2_experiences").update(payload).eq("id", editingExpId); error = res.error; } 
    else { const res = await supabase.from("v2_experiences").insert([payload]); error = res.error; }
    setLoading(false);
    if (error) alert("Gagal: " + error.message);
    else {
      setIsExpFormOpen(false); setEditingExpId(null);
      const { data } = await supabase.from("v2_experiences").select("*").order("order_index", { ascending: true });
      if (data) setExperiences(data);
    }
  };
  const handleDeleteExperience = async (id) => {
    if (window.confirm("Hapus?")) { await supabase.from("v2_experiences").delete().eq("id", id); setExperiences(experiences.filter(exp => exp.id !== id)); }
  };

  // --- SKILLS ---
  const handleEditSkillClick = (skill) => { setEditingSkillId(skill.id); setSkillName(skill.name); };
  const handleSaveSkill = async (e) => {
    e.preventDefault(); if (!skillName.trim()) return; setLoading(true);
    if (editingSkillId) await supabase.from("v2_skills").update({ name: skillName }).eq("id", editingSkillId);
    else await supabase.from("v2_skills").insert([{ name: skillName, order_index: skills.length }]);
    setLoading(false); setSkillName(""); setEditingSkillId(null);
    const { data } = await supabase.from("v2_skills").select("*").order("order_index", { ascending: true });
    if (data) setSkills(data);
  };
  const handleDeleteSkill = async (id) => {
    if (window.confirm("Hapus?")) { await supabase.from("v2_skills").delete().eq("id", id); setSkills(skills.filter(s => s.id !== id)); }
  };

  // --- CERTIFICATIONS ---
  const handleOpenCertForm = (cert = null) => {
    if (cert) {
      setEditingCertId(cert.id);
      setCertFormData({ title: cert.title, issuer: cert.issuer, date_issued: cert.date_issued, description: cert.description, image_urls: cert.image_urls || [] });
    } else {
      setEditingCertId(null); setCertFormData({ title: "", issuer: "", date_issued: "", description: "", image_urls: [] });
    }
    setIsCertFormOpen(true);
  };
  const handleSaveCert = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...certFormData, order_index: editingCertId ? undefined : certifications.length };
    let error;
    if (editingCertId) { const res = await supabase.from("v2_certifications").update(payload).eq("id", editingCertId); error = res.error; } 
    else { const res = await supabase.from("v2_certifications").insert([payload]); error = res.error; }
    setLoading(false);
    if (error) alert("Gagal: " + error.message);
    else {
      setIsCertFormOpen(false); setEditingCertId(null);
      const { data } = await supabase.from("v2_certifications").select("*").order("order_index", { ascending: true });
      if (data) setCertifications(data);
    }
  };
  const handleDeleteCert = async (id) => {
    if (window.confirm("Hapus sertifikasi ini?")) { await supabase.from("v2_certifications").delete().eq("id", id); setCertifications(certifications.filter(c => c.id !== id)); }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "projects", label: "Projects", icon: <Code className="w-4 h-4" /> },
    { id: "experiences", label: "Experiences", icon: <Briefcase className="w-4 h-4" /> },
    { id: "certifications", label: "Certifications", icon: <Award className="w-4 h-4" /> },
    { id: "skills", label: "Skills", icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gray-900 p-2 rounded-xl shadow-sm"><LayoutDashboard className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Control Panel</h1>
              <p className="text-sm text-gray-500 font-medium">Manage your portfolio content.</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 font-bold text-sm shadow-sm"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-gray-900 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-900 hover:text-gray-900"}`}>{tab.icon} {tab.label}</button>
              ))}
            </nav>
          </div>

          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[60vh]">
            
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Edit Profile Information</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label><input type="text" required value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Headline</label><input type="text" required value={profileData.headline} onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900" /></div>
                  </div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">Professional Summary</label><textarea rows="4" required value={profileData.summary} onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 resize-none" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Foto Profil (Kotak 1:1)</label>
                      {profileData.profile_image_url && <img src={profileData.profile_image_url} alt="Profile" className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-gray-200" />}
                      <input type="file" accept="image/*" onChange={(e) => onFileSelect(e, "profile_image_url")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-200 cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Foto Banner</label>
                      {profileData.banner_image_url && <img src={profileData.banner_image_url} alt="Banner" className="w-full h-20 rounded-xl object-cover object-center mb-4 shadow-sm border border-gray-200" />}
                      <input type="file" accept="image/*" onChange={(e) => onFileSelect(e, "banner_image_url")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-200 cursor-pointer" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end"><button type="submit" disabled={loading} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:bg-gray-400">Save Profile</button></div>
                </form>
              </div>
            )}

            {/* TAB PROJECTS */}
            {activeTab === "projects" && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold">Manage Works & Projects</h2>
                  <button onClick={() => isProjectFormOpen ? setIsProjectFormOpen(false) : handleOpenProjectForm()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">
                    {isProjectFormOpen ? "Batal" : <><Plus className="w-4 h-4" /> Add Project</>}
                  </button>
                </div>
                
                {isProjectFormOpen && (
                  <form onSubmit={handleSaveProject} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 space-y-4">
                    <h3 className="font-bold text-gray-900 mb-4">{editingProjectId ? "Edit Karya" : "Buat Karya Baru"}</h3>
                    <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Dokumentasi</label>
                      {projectFormData.image_urls.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
                          {projectFormData.image_urls.map((url, idx) => (
                            <div key={idx} className="relative shrink-0"><img src={url} alt="Preview" className="h-24 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50" /><button type="button" onClick={() => removeGenericImage(idx, projectFormData, setProjectFormData)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X className="w-3 h-3"/></button></div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4"><input type="file" multiple accept="image/*" onChange={(e) => handleGenericImagesUpload(e, projectFormData, setProjectFormData)} disabled={uploadingImage} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Judul</label><input type="text" required value={projectFormData.title} onChange={e => setProjectFormData({...projectFormData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Kategori / Label</label><input type="text" required value={projectFormData.tech_stack} onChange={e => setProjectFormData({...projectFormData, tech_stack: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Lengkap</label><textarea rows="3" required value={projectFormData.description} onChange={e => setProjectFormData({...projectFormData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 resize-none" /></div>
                    <div className="pt-2"><button type="submit" disabled={loading || uploadingImage} className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black disabled:bg-gray-400">{editingProjectId ? "Update Proyek" : "Simpan Proyek"}</button></div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj, index) => (
                    <div key={proj.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={() => handleSort(projects, setProjects, "v2_projects")} onDragOver={(e) => e.preventDefault()} className="flex flex-col p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-shadow relative group cursor-grab active:cursor-grabbing">
                      <div className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 z-10 shadow-sm"><GripVertical className="w-4 h-4" /></div>
                      {proj.image_urls && proj.image_urls.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 snap-x hide-scrollbar">{proj.image_urls.map((img, i) => <img key={i} src={img} className="h-32 w-auto shrink-0 snap-center rounded-xl object-contain bg-gray-50 border border-gray-100" />)}</div>
                      ) : (<div className="w-full h-32 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">Tanpa Gambar</div>)}
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{proj.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proj.description}</p>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => handleOpenProjectForm(proj)} className="p-2 bg-white/90 backdrop-blur text-blue-500 hover:bg-blue-50 rounded-lg shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="p-2 bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB EXPERIENCES */}
            {activeTab === "experiences" && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold">Manage Experiences</h2>
                  <button onClick={() => isExpFormOpen ? setIsExpFormOpen(false) : handleOpenExpForm()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">
                    {isExpFormOpen ? "Batal" : <><Plus className="w-4 h-4" /> Add Experience</>}
                  </button>
                </div>
                
                {isExpFormOpen && (
                  <form onSubmit={handleSaveExperience} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 space-y-4">
                    {/* Sama seperti form project, input image diringkas menggunakan handleGenericImagesUpload */}
                    <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Dokumentasi Opsional</label>
                      {expFormData.image_urls.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
                          {expFormData.image_urls.map((url, idx) => (
                            <div key={idx} className="relative shrink-0"><img src={url} alt="Preview" className="h-24 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50" /><button type="button" onClick={() => removeGenericImage(idx, expFormData, setExpFormData)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X className="w-3 h-3"/></button></div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4"><input type="file" multiple accept="image/*" onChange={(e) => handleGenericImagesUpload(e, expFormData, setExpFormData)} disabled={uploadingImage} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Role / Jabatan</label><input type="text" required value={expFormData.role} onChange={e => setExpFormData({...expFormData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Company / Organisasi</label><input type="text" required value={expFormData.company} onChange={e => setExpFormData({...expFormData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Periode</label><input type="text" required value={expFormData.period} onChange={e => setExpFormData({...expFormData, period: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Kategori Pengalaman</label>
                        <select value={expFormData.category} onChange={e => setExpFormData({...expFormData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                          <option value="Work Experience">Work / Professional Experience</option>
                          <option value="Leadership Experience">Leadership / Organization</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Pekerjaan</label><textarea rows="3" required value={expFormData.description} onChange={e => setExpFormData({...expFormData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 resize-none" /></div>
                    <div className="pt-2"><button type="submit" disabled={loading || uploadingImage} className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black">{editingExpId ? "Update Pengalaman" : "Simpan Pengalaman"}</button></div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={() => handleSort(experiences, setExperiences, "v2_experiences")} onDragOver={(e) => e.preventDefault()} className="group flex flex-col p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing pl-10">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-500 transition-colors"><GripVertical className="w-5 h-5" /></div>
                      <span className="self-start px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md mb-4">{exp.category || "Work Experience"}</span>
                      {exp.image_urls && exp.image_urls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 snap-x hide-scrollbar">{exp.image_urls.map((img, i) => <img key={i} src={img} className="h-20 w-auto shrink-0 snap-center rounded-lg object-contain bg-gray-50 border border-gray-100" />)}</div>
                      )}
                      <div className="pr-16"><h3 className="font-bold text-lg text-gray-900">{exp.role}</h3><p className="text-blue-600 font-bold mt-1">{exp.company} <span className="text-gray-400 font-normal">({exp.period})</span></p></div>
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => handleOpenExpForm(exp)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteExperience(exp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold">Manage Certifications</h2>
                  <button onClick={() => isCertFormOpen ? setIsCertFormOpen(false) : handleOpenCertForm()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">
                    {isCertFormOpen ? "Batal" : <><Plus className="w-4 h-4" /> Add Certificate</>}
                  </button>
                </div>
                
                {isCertFormOpen && (
                  <form onSubmit={handleSaveCert} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 space-y-4">
                    <h3 className="font-bold text-gray-900 mb-4">{editingCertId ? "Edit Sertifikasi" : "Tambah Sertifikasi Baru"}</h3>
                    <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-400" /> Scan Sertifikat</label>
                      {certFormData.image_urls.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
                          {certFormData.image_urls.map((url, idx) => (
                            <div key={idx} className="relative shrink-0"><img src={url} alt="Preview" className="h-24 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50" /><button type="button" onClick={() => removeGenericImage(idx, certFormData, setCertFormData)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"><X className="w-3 h-3"/></button></div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4"><input type="file" multiple accept="image/*" onChange={(e) => handleGenericImagesUpload(e, certFormData, setCertFormData)} disabled={uploadingImage} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Nama Sertifikasi</label><input type="text" required value={certFormData.title} onChange={e => setCertFormData({...certFormData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-1">Penerbit (Issuer)</label><input type="text" required value={certFormData.issuer} onChange={e => setCertFormData({...certFormData, issuer: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Terbit / Kadaluarsa</label><input type="text" required value={certFormData.date_issued} onChange={e => setCertFormData({...certFormData, date_issued: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Kompetensi / ID Kredensial</label><textarea rows="3" required value={certFormData.description} onChange={e => setCertFormData({...certFormData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 resize-none" /></div>
                    <div className="pt-2"><button type="submit" disabled={loading || uploadingImage} className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black">{editingCertId ? "Update Sertifikasi" : "Simpan Sertifikasi"}</button></div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert, index) => (
                    <div key={cert.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={() => handleSort(certifications, setCertifications, "v2_certifications")} onDragOver={(e) => e.preventDefault()} className="flex flex-col p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-shadow relative group cursor-grab active:cursor-grabbing">
                      <div className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 z-10 shadow-sm"><GripVertical className="w-4 h-4" /></div>
                      {cert.image_urls && cert.image_urls.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 snap-x hide-scrollbar">{cert.image_urls.map((img, i) => <img key={i} src={img} className="h-32 w-auto shrink-0 snap-center rounded-xl object-contain bg-gray-50 border border-gray-100" />)}</div>
                      ) : (<div className="w-full h-32 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">Tanpa Gambar</div>)}
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{cert.title}</h3>
                      <p className="text-sm text-blue-600 font-bold mt-1">{cert.issuer}</p>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => handleOpenCertForm(cert)} className="p-2 bg-white/90 backdrop-blur text-blue-500 hover:bg-blue-50 rounded-lg shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCert(cert.id)} className="p-2 bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB SKILLS */}
            {activeTab === "skills" && (
              <div>
                <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Manage Technical Skills</h2>
                <form onSubmit={handleSaveSkill} className="flex gap-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{editingSkillId ? "Edit Skill" : "Tambah Skill Baru"}</label>
                    <input type="text" required value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. React" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <button type="submit" disabled={loading || !skillName.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black whitespace-nowrap">
                    {editingSkillId ? <><Save className="w-4 h-4"/> Update</> : <><Plus className="w-4 h-4" /> Add Skill</>}
                  </button>
                  {editingSkillId && <button type="button" onClick={() => { setEditingSkillId(null); setSkillName(""); }} className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">Batal</button>}
                </form>
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  {skills.length === 0 ? <p className="text-gray-500 text-sm text-center">Belum ada skill.</p> : (
                    <div className="flex flex-wrap gap-3">
                      {skills.map((skill, index) => (
                        <div key={skill.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={() => handleSort(skills, setSkills, "v2_skills")} onDragOver={(e) => e.preventDefault()} className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg shadow-sm hover:border-gray-900 transition-colors cursor-grab active:cursor-grabbing">
                          <span onClick={() => handleEditSkillClick(skill)}>{skill.name}</span>
                          <div className="w-px h-4 bg-gray-200 mx-1"></div>
                          <button onClick={() => handleEditSkillClick(skill)} className="text-gray-300 hover:text-blue-500 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteSkill(skill.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* POP-UP CROPPER (Profil & Banner) */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">Atur Gambar</h3>
              <button onClick={() => setCropModal({ isOpen: false, src: null, field: null, aspect: 1 })} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative w-full h-[400px] bg-gray-100">
              <Cropper image={cropModal.src} crop={crop} zoom={zoom} aspect={cropModal.aspect} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-1/2">
                <span className="text-sm font-bold text-gray-500">Zoom:</span>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-gray-900" />
              </div>
              <button onClick={handleSaveCrop} disabled={uploadingImage} className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:bg-gray-400">
                {uploadingImage ? "Menyimpan..." : "Potong & Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}