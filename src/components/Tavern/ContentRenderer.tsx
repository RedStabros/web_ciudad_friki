import React from 'react';

interface ContentRendererProps {
    content: string;
    className?: string;
}

export function ContentRenderer({ content, className = "" }: ContentRendererProps) {
    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)$/;
    const tiktokRegex = /^(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/.*\/video\/)(\d+)(?:[^\s]*)$/;

    // Split content by URLs
    const parts = content.split(urlRegex);

    return (
        <div className={`whitespace-pre-line break-words ${className}`}>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    const isImage = part.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)(\?.*)?$/i);
                    const ytMatch = part.match(youtubeRegex);
                    const ttMatch = part.match(tiktokRegex);

                    if (ytMatch) {
                        return (
                            <div key={index} className="my-4 aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg group relative">
                                <iframe
                                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                    title="YouTube video player"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        );
                    }

                    if (ttMatch) {
                        return (
                            <div key={index} className="my-4 max-w-[325px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
                                <iframe
                                    src={`https://www.tiktok.com/embed/v2/${ttMatch[1]}`}
                                    title="TikTok video player"
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                />
                            </div>
                        );
                    }

                    if (isImage) {
                        return (
                            <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group cursor-pointer" onClick={() => window.open(part, '_blank')}>
                                <img
                                    src={part}
                                    alt="Embedded content"
                                    className="max-w-full h-auto object-contain bg-slate-100 dark:bg-slate-900 mx-auto group-hover:scale-[1.02] transition-transform duration-300"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback to link if image fails to load
                                        (e.target as any).style.display = 'none';
                                        const link = document.createElement('a');
                                        link.href = part;
                                        link.target = "_blank";
                                        link.rel = "noopener noreferrer";
                                        link.className = "text-primary hover:underline break-all";
                                        link.innerText = part;
                                        (e.target as any).parentNode.appendChild(link);
                                    }}
                                />
                            </div>
                        );
                    }

                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }

                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </div>
    );
}
