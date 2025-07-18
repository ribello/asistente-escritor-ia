import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { BookText, Image as ImageIcon, Lightbulb, Sparkles, PlusCircle, Eye, X, ArrowLeft, ListOrdered, LogIn, LogOut } from 'lucide-react';

// --- CONFIGURACIÓN ---
const firebaseConfig = {
  apiKey: "AIzaSyB9g0YveOlHOB1oSSFvNKOKevGsjYB06sk",
  authDomain: "asistente-de-escritura.firebaseapp.com",
  projectId: "asistente-de-escritura",
  storageBucket: "asistente-de-escritura.firebasestorage.app",
  messagingSenderId: "747549095010",
  appId: "1:747549095010:web:cdf74ecc79087715080d3b"
};

<<<<<<< HEAD
const GOOGLE_AI_API_KEY = "AIzaSyBurU72YTk7lSkX5pi6HBKSZnUcjl1nbC8";
=======
const GOOGLE_AI_API_KEY = "AIzaSyCAIisxYlJM9lHrUfTGeALv30-UplNw4Ys";
>>>>>>> parent of a36ee8b (Actualizar API Key)

// --- COMPONENTES DE LA INTERFAZ ---

const Loader = ({ text = "Cargando..." }) => (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
        <p className="text-white text-lg mt-4">{text}</p>
    </div>
);

const LoginView = ({ auth }) => {
    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error durante el inicio de sesión con Google:", error);
            alert("No se pudo iniciar sesión. Por favor, inténtalo de nuevo.");
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
            <h1 className="text-5xl font-bold mb-4">Asistente de Escritura IA</h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl">Tu compañero creativo para dar vida a tus historias. Inicia sesión para guardar tus proyectos de forma segura en la nube.</p>
            <button onClick={handleLogin} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-lg flex items-center text-lg shadow-lg transition-transform transform hover:scale-105">
                <LogIn className="mr-3" /> Iniciar Sesión con Google
            </button>
        </div>
    );
};

const ProjectSelectionView = ({ projects, onSelectProject, onCreateProject, auth, user }) => {
    const [newProjectTitle, setNewProjectTitle] = useState('');

    const handleCreate = () => {
        if (newProjectTitle.trim()) {
            onCreateProject(newProjectTitle);
            setNewProjectTitle('');
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-8 bg-gray-900">
             <div className="absolute top-6 right-6 flex items-center space-x-4">
                <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                <span className="text-white">{user.displayName}</span>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full" title="Cerrar sesión">
                    <LogOut size={20} />
                </button>
            </div>
            <h1 className="text-5xl font-bold text-white mb-8">Mis Proyectos</h1>
            <div className="w-full max-w-md mb-8">
                <div className="flex space-x-2">
                    <input type="text" value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreate()} placeholder="Título del nuevo libro..." className="flex-grow bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center">
                        <PlusCircle className="mr-2" /> Crear
                    </button>
                </div>
            </div>
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <button key={project.id} onClick={() => onSelectProject(project.id)} className="bg-gray-800 hover:bg-sky-700 p-6 rounded-lg shadow-lg text-left transition-all transform hover:-translate-y-1">
                        <h2 className="text-xl font-bold text-white mb-2">{project.title}</h2>
                        <p className="text-gray-400 text-sm">{project.chapters?.length || 0} capítulos</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const EditorView = ({ project, onBack, db, storage, auth, setGlobalLoading }) => {
    const [activeTab, setActiveTab] = useState('writing');
    const [isPreviewing, setIsPreviewing] = useState(false);

    const handleUpdateProject = useCallback(async (data) => {
        if (!db || !auth.currentUser || !project?.id) return;
        const projectDocRef = doc(db, `users/${auth.currentUser.uid}/projects/${project.id}`);
        await updateDoc(projectDocRef, { ...data, updatedAt: new Date() });
    }, [db, auth.currentUser, project?.id]);

    const createEbook = () => {
        if (!project) return;
        const title = project.title || "Mi Libro";
        const instructions = `<div id="print-instructions" style="text-align:center; padding: 2rem; background-color: #f0f9ff; border: 2px solid #38bdf8; border-radius: 8px; margin-bottom: 3rem; font-family: 'Inter', sans-serif; color: #075985;">
            <h2 style="font-size: 1.5em; margin-top: 0;">¡Tu libro está listo!</h2>
            <p style="font-size: 1.1em;">Para guardarlo como PDF, presiona las teclas <strong>Ctrl + P</strong> y, en la ventana de impresión, selecciona el destino <strong>"Guardar como PDF"</strong>.</p>
            <button onclick="document.getElementById('print-instructions').style.display='none'; window.print();" style="background-color: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 1em; cursor: pointer;">Imprimir / Guardar PDF</button>
        </div>`;
        const coverImage = project.coverImageUrl ? `<img src="${project.coverImageUrl}" alt="Portada" style="width:100%; max-width:600px; height:auto; display:block; margin:0 auto 5rem auto; page-break-after: always;">` : '';
        const indexHtml = project.indexContent ? `<div style="page-break-after: always;"><h2 style="text-align:center; font-size: 2.5em; margin-bottom: 2rem; font-family: 'Inter', sans-serif;">Índice</h2><div style="font-size: 1.2em; line-height: 2.2;">${project.indexContent.replace(/\n/g, '<br>')}</div></div>` : '';
        const content = project.chapters.map(c => `
            <h2 style="font-size:2em; margin-top: 2rem; margin-bottom: 0.5rem; font-family: 'Inter', sans-serif;">Capítulo ${c.number}</h2>
            ${c.name ? `<h3 style="font-size: 1.5em; font-style: italic; color: #555; text-align:center; margin-bottom: 2rem; font-family: 'Inter', sans-serif;">${c.name}</h3>` : ''}
            <div>${(c.formattedContent || c.rawContent).split('\n').map(p => `<p style="text-indent:2em; margin-bottom:1em; line-height:1.8;">${p}</p>`).join('')}</div>
        `).join('');
        const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:'Georgia',serif;line-height:1.8;color:#333;max-width:800px;margin:2rem auto;padding:2rem;} @page { margin: 1in; } @media print { #print-instructions { display: none; } } h1,h2,h3 {font-family: 'Inter', sans-serif; text-align:center; page-break-after: avoid;} h1{font-size:3.5em; page-break-before: always;} h2{font-size:2em; page-break-before: always; padding-top: 2rem;} p{text-indent:2em;margin-bottom:1em; line-height:1.8;}</style></head><body>${instructions}${coverImage}<h1 style="page-break-before: always;">${title}</h1>${indexHtml}<div>${content}</div></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        window.open(URL.createObjectURL(blob), '_blank');
    };
    
    const renderContent = () => {
        const props = { projectData: project, updateProject: handleUpdateProject, setGlobalLoading, db, storage, auth };
        switch(activeTab) {
            case 'writing': return <WritingView {...props} />;
            case 'index': return <IndexView {...props} />;
            case 'cover': return <CoverView {...props} />;
            case 'notes': return <NotesView {...props} />;
            case 'assistant': return <AssistantView {...props} />;
            default: return null;
        }
    }

    return (
        <div className="bg-gray-900 text-white font-sans flex flex-col md:flex-row h-screen antialiased">
            {isPreviewing && <PreviewModal projectData={project} onClose={() => setIsPreviewing(false)} />}
            <nav className="w-full md:w-64 bg-gray-800 p-4 flex flex-row md:flex-col justify-around md:justify-start md:space-y-2 border-b-2 md:border-b-0 md:border-r-2 border-gray-700">
                <button onClick={onBack} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white mb-4">
                    <ArrowLeft /> <span className="font-medium">Mis Proyectos</span>
                </button>
                 {[{tab: 'writing', icon: BookText, label: 'Escribir'}, {tab: 'index', icon: ListOrdered, label: 'Índice'}, {tab: 'cover', icon: ImageIcon, label: 'Portada'}, {tab: 'notes', icon: Lightbulb, label: 'Ideas'}, {tab: 'assistant', icon: Sparkles, label: 'Ayudante IA'}].map(item => (
                    <NavTab key={item.tab} icon={React.createElement(item.icon)} label={item.label} isActive={activeTab === item.tab} onClick={() => setActiveTab(item.tab)} />
                ))}
                <div className="hidden md:block flex-grow"></div>
                <div className="flex flex-col space-y-2 mt-auto">
                    <button onClick={() => setIsPreviewing(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                        <Eye className="mr-2" /> Previsualizar
                    </button>
                    <button onClick={createEbook} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
                        Crear eBook (PDF)
                    </button>
                </div>
            </nav>
            <main className="flex-grow h-full overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

const NavTab = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${isActive ? 'bg-sky-500 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}>
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const PreviewModal = ({ projectData, onClose }) => {
    if (!projectData) return null;
    const title = projectData.title || "Mi Libro";
    const coverImage = projectData.coverImageUrl ? `<img src="${projectData.coverImageUrl}" alt="Portada" style="width: 80%; max-width: 400px; height: auto; display: block; margin: 0 auto 3rem auto; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">` : '';
    const indexHtml = projectData.indexContent ? `<div style="margin-bottom: 3rem; padding: 2rem; border: 1px solid #eee; border-radius: 8px;"><h2 style="text-align: center; font-size: 2.2em; color: #222; margin-bottom: 1.5rem; text-indent: 0;">Índice</h2><div style="line-height: 2; font-size: 1.1em;">${projectData.indexContent.replace(/\n/g, '<br>')}</div></div>` : '';
    const chaptersHtml = projectData.chapters.map(chapter => {
        const contentToShow = chapter.formattedContent || chapter.rawContent || '';
        return `<div class="mb-8"><h2 style="font-size: 2em; color: #222; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin: 2rem 0 1rem 0; text-indent: 0;">Capítulo ${chapter.number}</h2>${chapter.name ? `<h3 style="font-size: 1.5em; color: #444; text-align: center; margin-bottom: 1.5rem; font-style: italic;">${chapter.name}</h3>` : ''}<div style="line-height: 1.8; text-indent: 2em;">${contentToShow.split('\n').map(p => `<p style="margin-bottom: 1em;">${p}</p>`).join('')}</div></div>`
    }).join('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800">Previsualización del Libro</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div>
                <div className="flex-grow overflow-y-auto p-8 font-serif text-gray-800" dangerouslySetInnerHTML={{ __html: coverImage + `<h1 style="text-align: center; margin-bottom: 3rem; font-size: 3em; color: #111;">${title}</h1>` + indexHtml + `<div>${chaptersHtml}</div>` }} />
            </div>
        </div>
    );
};

const WritingView = ({ projectData, updateProject, setGlobalLoading }) => {
    const [activeChapterId, setActiveChapterId] = useState(null);
    const activeChapter = projectData.chapters.find(c => c.id === activeChapterId);

    useEffect(() => {
        if (projectData.chapters.length > 0 && !projectData.chapters.find(c => c.id === activeChapterId)) {
            setActiveChapterId(projectData.chapters[0].id);
        }
    }, [projectData.chapters, activeChapterId]);

    const handleAddChapter = () => {
        const newChapter = { id: Date.now().toString(), number: projectData.chapters.length + 1, name: '', rawContent: '', formattedContent: '', lastCorrectedIndex: 0 };
        updateProject({ chapters: [...projectData.chapters, newChapter] });
        setActiveChapterId(newChapter.id);
    };

    const handleChapterUpdate = (field, value) => {
        const updatedChapters = projectData.chapters.map(c => c.id === activeChapterId ? { ...c, [field]: value } : c);
        updateProject({ chapters: updatedChapters });
    };

    const handleCorrection = async () => {
        if (!activeChapter) return;
        const textToProcess = activeChapter.rawContent.substring(activeChapter.lastCorrectedIndex || 0);
        if (textToProcess.trim() === '') return;

        setGlobalLoading(true, "Corrigiendo con IA...");
        try {
            const prompt = `Eres un asistente de escritura experto para un novelista. Tu tarea es tomar el siguiente fragmento de texto, corregir la ortografía y la gramática, mejorar el estilo para que sea más evocador y literario, y darle un formato de maquetación simple usando saltos de línea para los párrafos. No añadas comentarios, solo devuelve el texto procesado. El texto es:\n\n"${textToProcess}"`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error("Error en la respuesta de la API de IA.");
            const result = await response.json();
            const correctedText = result.candidates[0].content.parts[0].text;

            const updatedChapters = projectData.chapters.map(c => c.id === activeChapterId ? { ...c, formattedContent: (c.formattedContent || '') + '\n' + correctedText, lastCorrectedIndex: c.rawContent.length } : c);
            updateProject({ chapters: updatedChapters });
        } catch (error) {
            console.error("Error en la corrección con IA:", error);
            alert("Hubo un problema al contactar a la IA.");
        } finally {
            setGlobalLoading(false);
        }
    };

    return (
        <div className="flex h-full">
            <div className="w-1/4 bg-gray-800/50 p-4 border-r border-gray-700 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4">Capítulos</h3>
                <div className="flex-grow overflow-y-auto space-y-2">
                    {projectData.chapters.map(c => (
                        <div key={c.id} onClick={() => setActiveChapterId(c.id)} className={`group flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer ${c.id === activeChapterId ? 'bg-sky-600 text-white' : 'hover:bg-gray-700'}`}>
                            <span className="font-medium">Capítulo {c.number}</span>
                            <span className="text-sm text-gray-400 ml-2 truncate group-hover:text-white">{c.name || ''}</span>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddChapter} className="mt-4 w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"><PlusCircle className="mr-2" /> Añadir Capítulo</button>
            </div>
            <div className="w-3/4 p-4 sm:p-8 flex flex-col">
                {activeChapter ? (
                    <>
                        <h2 className="text-3xl font-bold text-white">Capítulo {activeChapter.number}</h2>
                        <input type="text" value={activeChapter.name || ''} onBlur={e => handleChapterUpdate('name', e.target.value)} onChange={e => handleChapterUpdate('name', e.target.value)} placeholder="Nombre del capítulo (opcional)..." className="bg-transparent text-xl text-gray-400 focus:text-white focus:outline-none border-b-2 border-gray-700 focus:border-sky-500 py-2 mb-6 transition-colors" />
                        <div className="flex-grow flex flex-col bg-gray-800 rounded-lg shadow-inner overflow-hidden">
                            <div className="flex-grow p-6 overflow-y-auto">
                                {activeChapter.formattedContent && <div className="whitespace-pre-wrap text-gray-300 bg-gray-900/50 p-4 rounded-md mb-4" dangerouslySetInnerHTML={{ __html: activeChapter.formattedContent.replace(/\n/g, '<br>') }} />}
                                <textarea value={activeChapter.rawContent.substring(activeChapter.lastCorrectedIndex || 0)} onChange={e => handleChapterUpdate('rawContent', (activeChapter.rawContent.substring(0, activeChapter.lastCorrectedIndex || 0) + e.target.value))} className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg leading-relaxed" placeholder="Comienza a escribir..." rows="10" />
                            </div>
                            <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                                <button onClick={handleCorrection} className="w-full flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg"><Sparkles className="mr-2" /> Asistente IA: Corregir</button>
                            </div>
                        </div>
                    </>
                ) : <div className="flex-grow flex items-center justify-center"><p className="text-gray-500 text-2xl">Selecciona o crea un capítulo para empezar.</p></div>}
            </div>
        </div>
    );
};

const IndexView = ({ projectData, updateProject, setGlobalLoading }) => {
    const handleGenerateIndex = async () => {
        setGlobalLoading(true, "Generando índice con IA...");
        try {
            const chapterList = projectData.chapters.map(c => `Capítulo ${c.number}: ${c.name || 'Sin título'}`).join('\n');
            const prompt = `Eres un editor profesional. A partir de la siguiente lista de capítulos, crea un índice de libro bien formateado. Solo devuelve el índice, sin comentarios adicionales.\n\nLISTA:\n${chapterList}`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error("Error en la respuesta de la API de IA.");
            const result = await response.json();
            const indexContent = result.candidates[0].content.parts[0].text;
            updateProject({ indexContent });
        } catch (error) {
            console.error("Error generando índice:", error);
            alert("Hubo un problema al generar el índice.");
        } finally {
            setGlobalLoading(false);
        }
    };
    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Índice del Libro</h2>
            <p className="text-gray-400 mb-6">Genera y revisa el índice de tu libro.</p>
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner">
                <div className="w-full bg-gray-900 text-white p-4 rounded-md min-h-[200px] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: projectData.indexContent ? projectData.indexContent.replace(/\n/g, '<br>') : '<span class="text-gray-500">El índice aparecerá aquí...</span>' }} />
                <button onClick={handleGenerateIndex} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg"><ListOrdered className="inline-block mr-2" /> Generar Índice con IA</button>
            </div>
        </div>
    );
};

const CoverView = ({ projectData, updateProject, setGlobalLoading, storage, auth }) => {
    const [prompt, setPrompt] = useState(projectData.coverPrompt || '');

    const generateImage = async () => {
        if (prompt.trim() === '') { alert("Por favor, describe la portada."); return; }
        setGlobalLoading(true, "Generando portada con IA...");
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt: `Portada de libro de alta calidad, ilustración digital. Tema: ${prompt}.` }], parameters: { "sampleCount": 1 } })
            });
            if (!response.ok) throw new Error("Error en la respuesta de la API de Imagen.");
            const result = await response.json();
            const base64ImageData = result.predictions[0].bytesBase64Encoded;
            
            setGlobalLoading(true, "Subiendo portada...");
            const storageRef = ref(storage, `users/${auth.currentUser.uid}/projects/${projectData.id}/cover.png`);
            const uploadResult = await uploadString(storageRef, `data:image/png;base64,${base64ImageData}`, 'data_url');
            const downloadURL = await getDownloadURL(uploadResult.ref);
            
            updateProject({ coverImageUrl: downloadURL, coverPrompt: prompt });
        } catch (error) {
            console.error("Error generando imagen:", error);
            alert("Hubo un problema al generar la portada.");
        } finally {
            setGlobalLoading(false);
        }
    };
    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Diseñador de Portada</h2>
            <p className="text-gray-400 mb-6">Describe la imagen para la portada de este proyecto.</p>
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Ej: Un castillo flotando entre nubes púrpuras." rows="3" />
                <button onClick={generateImage} className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg"><ImageIcon className="inline-block mr-2" /> Generar Portada con IA</button>
            </div>
            <div className="mt-8"><h3 className="text-2xl font-bold text-white mb-4">Tu Portada</h3><div className="w-full max-w-sm mx-auto aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center shadow-lg">{projectData.coverImageUrl ? <img src={projectData.coverImageUrl} alt="Portada generada" className="w-full h-full object-cover rounded-lg" /> : <p className="text-gray-500">Aquí aparecerá tu portada...</p>}</div></div>
        </div>
    );
};

const NotesView = ({ projectData, updateProject }) => (
    <div className="p-4 sm:p-8 h-full flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-2">Bloc de Ideas</h2>
        <p className="text-gray-400 mb-6">Apunta aquí las ideas para este proyecto.</p>
        <textarea value={projectData.notes || ''} onBlur={e => updateProject({ notes: e.target.value })} onChange={e => updateProject({ notes: e.target.value })} className="w-full flex-grow bg-gray-800 text-white p-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner text-lg" placeholder="Ideas..." />
    </div>
);

const AssistantView = ({ setGlobalLoading }) => {
    const [history, setHistory] = useState([]);
    const [query, setQuery] = useState('');
    const handleQuery = async () => {
        if (query.trim() === '') return;
        const newHistory = [...history, { role: 'user', parts: [{ text: query }] }];
        setHistory(newHistory);
        setQuery('');
        setGlobalLoading(true, "Pensando...");
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GOOGLE_AI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: newHistory })
            });
            if (!response.ok) throw new Error("Error en la respuesta de la API.");
            const result = await response.json();
            setHistory([...newHistory, result.candidates[0].content]);
        } catch (error) {
            console.error("Error con el ayudante IA:", error);
            alert("Hubo un problema con el asistente de IA.");
        } finally {
            setGlobalLoading(false);
        }
    };
    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-2">Ayudante IA</h2>
            <p className="text-gray-400 mb-6">¿Necesitas inspiración? Pregúntame lo que quieras.</p>
            <div className="flex-grow bg-gray-800 rounded-lg shadow-inner flex flex-col overflow-hidden">
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {history.map((msg, index) => (<div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-200'}`}><p className="whitespace-pre-wrap">{msg.parts[0].text}</p></div></div>))}
                </div>
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex items-center">
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleQuery()} className="flex-grow bg-gray-700 text-white p-3 rounded-l-lg focus:outline-none" placeholder="Ej: Dame 5 nombres para una reina guerrera" />
                    <button onClick={handleQuery} className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-3 rounded-r-lg">Enviar</button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [storage, setStorage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Iniciando...");
    
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [activeProjectData, setActiveProjectData] = useState(null);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            const storageInstance = getStorage(app);
            setAuth(authInstance);
            setDb(dbInstance);
            setStorage(storageInstance);

            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Error de configuración de Firebase. Revisa tus variables en `firebaseConfig`.", error);
            alert("Error de configuración. Por favor, revisa la consola para más detalles.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && db) {
            const projectsColRef = collection(db, `users/${user.uid}/projects`);
            const q = query(projectsColRef);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [user, db]);

    useEffect(() => {
        if (activeProjectId && user && db) {
            const projectDocRef = doc(db, `users/${user.uid}/projects/${activeProjectId}`);
            const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
                setActiveProjectData(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
            });
            return () => unsubscribe();
        } else {
            setActiveProjectData(null);
        }
    }, [activeProjectId, user, db]);

    const handleCreateProject = async (title) => {
        if (!db || !user) return;
        setLoading(true, "Creando proyecto...");
        const newProject = { title, chapters: [], notes: "", coverImageUrl: null, indexContent: '', createdAt: new Date(), owner: user.uid };
        try {
            const projectsColRef = collection(db, `users/${user.uid}/projects`);
            const docRef = await addDoc(projectsColRef, newProject);
            setActiveProjectId(docRef.id);
        } catch (error) {
            console.error("Error creando proyecto:", error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <Loader text={loadingText} />;
    if (!user) return <LoginView auth={auth} />;
    if (!activeProjectId) return <ProjectSelectionView projects={projects} onSelectProject={setActiveProjectId} onCreateProject={handleCreateProject} auth={auth} user={user} />;
    if (activeProjectId && !activeProjectData) return <Loader text="Cargando proyecto..." />;

    return <EditorView project={activeProjectData} onBack={() => setActiveProjectId(null)} db={db} storage={storage} auth={auth} setGlobalLoading={(isLoading, text) => { setLoading(isLoading); setLoadingText(text); }} />;
}
