import { renderTextWithMedia } from '../../utils/mediaRenderer';

interface ContentRendererProps {
    content: string;
    className?: string;
}

export default function ContentRenderer({ content, className = "" }: ContentRendererProps) {
    return (
        <div className={`whitespace-pre-line break-words ${className}`}>
            {renderTextWithMedia(content)}
        </div>
    );
}
