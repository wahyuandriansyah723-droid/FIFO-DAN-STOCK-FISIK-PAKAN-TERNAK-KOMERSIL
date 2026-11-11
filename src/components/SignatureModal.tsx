import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Upload, PenTool, Check, Trash2, Type } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  signeeName: string;
  currentSignature?: string;
  onSaveSignature: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  title,
  signeeName,
  currentSignature,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'type'>('draw');
  const [penColor, setPenColor] = useState('#0f172a'); // slate-900 / dark
  const [penWidth, setPenWidth] = useState(3);
  const [typedName, setTypedName] = useState(signeeName || '');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedName(signeeName || '');
      setHasDrawn(false);
      setUploadedImage(null);

      // If currentSignature exists, setup canvas or state
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (currentSignature) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasDrawn(true);
              };
              img.src = currentSignature;
            }
          }
        }
      }, 100);
    }
  }, [isOpen, currentSignature, signeeName]);

  if (!isOpen) return null;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setUploadedImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTypedSignatureCanvas = (): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.font = 'italic bold 36px "Dancing Script", "Brush Script MT", "Caveat", cursive, sans-serif';
      ctx.fillStyle = penColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName || signeeName, 200, 80);

      // Underline
      ctx.beginPath();
      ctx.moveTo(80, 110);
      ctx.quadraticCurveTo(200, 120, 320, 110);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    return tempCanvas.toDataURL('image/png');
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSaveSignature(canvas.toDataURL('image/png'));
      } else {
        onSaveSignature('');
      }
    } else if (activeTab === 'upload') {
      if (uploadedImage) {
        onSaveSignature(uploadedImage);
      }
    } else if (activeTab === 'type') {
      if (typedName.trim()) {
        const generated = generateTypedSignatureCanvas();
        onSaveSignature(generated);
      }
    }
    onClose();
  };

  const handleRemove = () => {
    onSaveSignature('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-500" />
              <span>Isi Tanda Tangan ({title})</span>
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Penandatangan: <span className="text-amber-600 dark:text-amber-400 font-extrabold uppercase">{signeeName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 p-1.5 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Coret / Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Foto TTD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'type'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Tulis Nama</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'draw' && (
            <div className="space-y-3">
              {/* Canvas Controls */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Warna TTD:</span>
                  <button
                    type="button"
                    onClick={() => setPenColor('#0f172a')}
                    className={`w-6 h-6 rounded-full bg-slate-900 border-2 ${
                      penColor === '#0f172a' ? 'border-amber-500 scale-110' : 'border-transparent'
                    } cursor-pointer`}
                    title="Hitam Pekat"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#1e3a8a')}
                    className={`w-6 h-6 rounded-full bg-blue-900 border-2 ${
                      penColor === '#1e3a8a' ? 'border-amber-500 scale-110' : 'border-transparent'
                    } cursor-pointer`}
                    title="Biru Tinta Ballpoint"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#991b1b')}
                    className={`w-6 h-6 rounded-full bg-red-800 border-2 ${
                      penColor === '#991b1b' ? 'border-amber-500 scale-110' : 'border-transparent'
                    } cursor-pointer`}
                    title="Merah Stempel"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Tebal:</span>
                  <button
                    type="button"
                    onClick={() => setPenWidth(2)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    } cursor-pointer`}
                  >
                    Tipis
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(3.5)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 3.5 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    } cursor-pointer`}
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenWidth(5)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      penWidth === 5 ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    } cursor-pointer`}
                  >
                    Tebal
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 overflow-hidden group">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-semibold">
                    ✍️ Coret / Tanda tangan di sini menggunakan Mouse atau Layar Sentuh
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Hapus Coretan</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih File Foto / Scan Tanda Tangan (PNG / JPG / Stempel):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
              />

              {uploadedImage ? (
                <div className="p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center h-44">
                  <img src={uploadedImage} alt="Uploaded TTD" className="max-h-36 object-contain" />
                </div>
              ) : (
                <div className="h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <span>Belum ada foto yang dipilih</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'type' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tulis Nama Penandatangan:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold uppercase text-slate-900 dark:text-slate-100"
              />

              <div className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 flex flex-col items-center justify-center h-36">
                <p className="text-[10px] text-slate-400 font-sans mb-1">Preview TTD Digital Script:</p>
                <div className="font-serif italic text-2xl font-extrabold text-slate-800 dark:text-slate-200 tracking-wider">
                  {typedName || signeeName}
                </div>
                <div className="w-3/4 h-0.5 bg-slate-800 dark:bg-slate-200 mt-2 rounded-full opacity-80" />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-100/50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus TTD</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan TTD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
