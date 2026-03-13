import { useTranslation } from 'react-i18next';
import { renderTextWithMedia } from '../../utils/mediaRenderer';

interface ContentRendererProps {
    content: string;
    className?: string;
}

export default function ContentRenderer({ content, className = "" }: ContentRendererProps) {
    const { t } = useTranslation();
    return (
        <div className={`whitespace-pre-line break-words ${className}`}>
            {renderTextWithMedia(content, t)}
        </div>
    );
}
