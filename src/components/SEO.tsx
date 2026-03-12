import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogType?: string;
}

/**
 * Reusable SEO component to manage page metadata.
 * It appends "| Ciudad Friki" to the title and provides default values.
 */
export function SEO({ 
    title, 
    description = "La comunidad definitiva de cultura geek en Colombia. Eventos, anime, videojuegos y más.",
    keywords = "Anime, Geek, Colombia, Medellín, Eventos, Videojuegos, Cosplay, Manga",
    image = "/assets/seo/home_banner.png",
    ogTitle,
    ogDescription,
    ogType = "website"
}: SEOProps) {
    const fullTitle = `${title} | Ciudad Friki`;
    const fullImage = window.location.origin + image;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            
            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content="Ciudad Friki" />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || description} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
}
