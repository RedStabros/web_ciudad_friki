import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WalletScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

export function WalletScanner({ onScan, onClose }: WalletScannerProps) {
    const { t } = useTranslation();
    const scannerRegionId = 'qr-reader';
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');

    useEffect(() => {
        // Initialize Scanner on Mount
        const scanner = new Html5Qrcode(scannerRegionId);
        scannerRef.current = scanner;

        // Cleanup on unmount
        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(console.error);
            }
            scanner.clear();
        };
    }, []);

    const startCamera = async () => {
        if (!scannerRef.current) return;
        setCameraError(null);

        try {
            // Stop existing scan if any
            if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }

            setIsScanning(true);
            await scannerRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleResult(decodedText);
                },
                (_errorMessage) => {
                    // Ignore noisy frame errors
                }
            );
        } catch (err: any) {
            console.error('Camera Error:', err);
            setCameraError(t('wallet.cameraError', 'Error accessing camera.'));
            setIsScanning(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !scannerRef.current) return;

        try {
            setCameraError(null);
            // If camera is running, stop it
            if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
                setIsScanning(false);
            }

            const decodedText = await scannerRef.current.scanFile(file, true);
            handleResult(decodedText);
        } catch (err) {
            console.error('File Scan Error:', err);
            setCameraError(t('wallet.noQrFound', 'No se detectó un código QR válido en la imagen.'));
        }

        // Reset input
        event.target.value = '';
    };

    const handleResult = async (decodedText: string) => {
        // Briefly stop scanning to prevent double fires
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
        onScan(decodedText);
    };

    return (
        <div className="absolute inset-0 bg-bg-main z-[110] flex flex-col pt-8 pb-10">
            <header className="px-6 flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-text-main">{t('wallet.scan')} QR</h3>
                <button onClick={async () => { await stopCamera(); onClose(); }} className="text-text-muted hover:text-text-main p-2">
                    <X size={24} />
                </button>
            </header>

             <div className="flex-1 px-6 flex flex-col items-center">
                <div className="w-full max-w-sm aspect-square bg-bg-side border-2 border-dashed border-brand-primary/30 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center p-6">
                    {showManualInput ? (
                        <div className="w-full flex flex-col gap-4 text-center pointer-events-auto">
                            <h4 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('wallet.manualInputTitle', 'Entrada Manual')}</h4>
                            <p className="text-xs text-text-muted">{t('wallet.manualInputDesc', 'Ingresa el código del cupón o asignación')}</p>
                            <input 
                                type="text" 
                                value={manualCode} 
                                onChange={(e) => setManualCode(e.target.value)} 
                                placeholder="Ej: EVENT:EVENT:XYZ o ASSIGN:UUID" 
                                className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main text-sm font-mono focus:outline-none focus:border-brand-primary"
                            />
                            <button 
                                onClick={() => {
                                    if (manualCode.trim()) {
                                        handleResult(manualCode.trim());
                                    }
                                }}
                                className="w-full bg-brand-primary hover:bg-brand-primary-light text-text-inv font-black uppercase tracking-wider text-xs py-3 rounded-xl transition"
                            >
                                {t('wallet.manualRedeem', 'Canjear')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div id={scannerRegionId} className="w-full h-full" />
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-text-muted bg-bg-side pointer-events-none">
                                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                                    {cameraError ? (
                                        <p className="text-sm text-accent-red font-bold text-center">{cameraError}</p>
                                    ) : (
                                        <p className="text-sm font-medium text-center">{t('wallet.cameraPrompt', 'Iniciando cámara...')}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-8 flex gap-3 w-full max-w-sm">
                    <button
                        onClick={async () => {
                            setShowManualInput(false);
                            await startCamera();
                        }}
                        className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl transition border ${isScanning && !showManualInput ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-side border-border-theme text-text-main hover:bg-bg-sub'}`}
                    >
                        <Camera size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('wallet.useCamera', 'Escáner')}</span>
                    </button>

                    <button
                        onClick={async () => {
                            await stopCamera();
                            setShowManualInput(true);
                        }}
                        className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl transition border ${showManualInput ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-side border-border-theme text-text-main hover:bg-bg-sub'}`}
                    >
                        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('wallet.manualInput', 'Manual')}</span>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-bg-side border border-border-theme py-4 rounded-2xl hover:bg-bg-sub transition flex flex-col items-center justify-center gap-2 text-text-main"
                    >
                        <ImageIcon size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('wallet.scanFromGallery', 'Galería')}</span>
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>

            <p className="px-10 text-center mt-6 text-xs text-text-muted">
                {t('wallet.scanInstructions', 'Enfoca el código QR de un evento, de un usuario a transferir o escribe el código manualmente.')}
            </p>
        </div>
    );
}
