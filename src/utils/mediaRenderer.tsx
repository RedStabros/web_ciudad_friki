import { ExternalLink, Video, Youtube, Facebook, PlayCircle } from 'lucide-react';

export const renderTextWithMedia = (text: string, t: (key: string) => string) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part && part.match(urlRegex)) {
            // Check if it's an image
            if (part.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
                return (
                    <div key={i} className="my-3 share-media-container">
                        <img
                            src={part}
                            alt={t('media.attachment')}
                            className="max-w-full md:max-w-md h-auto rounded-2xl border border-divider-theme shadow-xl cursor-zoom-in hover:scale-[1.01] transition-transform"
                            loading="lazy"
                        />
                    </div>
                );
            }

            // Check for Video Platforms
            const isYoutube = part.includes('youtube.com') || part.includes('youtu.be');
            const isTiktok = part.includes('tiktok.com');
            const isFacebook = part.includes('facebook.com/reel') || part.includes('fb.watch');

            if (isYoutube || isTiktok || isFacebook) {
                let platformName = "Video";
                let Icon = Video;
                let color = "bg-slate-500";
                let thumb = null;

                if (isYoutube) {
                    platformName = t('media.youtube');
                    Icon = Youtube;
                    color = "bg-red-600";
                    // Simple YT Thumb
                    const ytId = part.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#\&\?]*)/)?.[1];
                    if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                } else if (isTiktok) {
                    platformName = t('media.tiktok');
                    Icon = PlayCircle;
                    color = "bg-zinc-900";
                } else if (isFacebook) {
                    platformName = t('media.facebookReel');
                    Icon = Facebook;
                    color = "bg-blue-600";
                }

                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block my-3 max-w-sm overflow-hidden rounded-2xl border border-divider-theme bg-bg-side hover:border-brand-primary/50 transition-all shadow-lg hover:shadow-brand-primary/10"
                    >
                        <div className="relative h-32 bg-bg-sub flex items-center justify-center overflow-hidden">
                            {thumb ? (
                                <img src={thumb} alt="thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                            ) : (
                                <div className={`absolute inset-0 opacity-10 ${color}`}></div>
                            )}
                            <div className={`z-10 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 group-hover:scale-110 transition-transform`}>
                                <Icon size={32} />
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isYoutube ? 'text-red-500' : isFacebook ? 'text-blue-500' : 'text-text-main'}`}>
                                    {platformName}
                                </span>
                                <span className="text-xs text-text-sub line-clamp-1 font-medium">{part}</span>
                            </div>
                            <ExternalLink size={16} className="text-text-muted group-hover:text-brand-primary transition-colors" />
                        </div>
                    </a>
                );
            }

            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline break-all font-bold inline-flex items-center gap-1 mx-1"
                >
                    {part} <ExternalLink size={12} />
                </a>
            );
        }
        return part;
    });
};
