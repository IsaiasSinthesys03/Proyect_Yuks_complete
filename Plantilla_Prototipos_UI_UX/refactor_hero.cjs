const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'landing_page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Agregar el import de HeroCarousel si no existe
const importHeroStr = "import HeroCarousel from './src/components/home/HeroCarousel';";
if (!content.includes('HeroCarousel')) {
    content = content.replace(
        "} from 'lucide-react';", 
        "} from 'lucide-react';\n\n" + importHeroStr
    );
}

// 2. Eliminar activeSlide
content = content.replace(/const \[activeSlide, setActiveSlide\] = useState\(0\);\n\s*/g, '');

// 3. Eliminar const banners = [...]
const bannersRegex = /\/\/ \[NUEVO\] Simulación de Banners de Campaña\s*const banners = \[[\s\S]*?\];/;
content = content.replace(bannersRegex, '');

// 4. Eliminar el useEffect de Hero Slider
const useEffectHeroRegex = /\/\/ \[NUEVO\] Auto-scroll para carrusel de trailers y auto-slide para Hero\s*useEffect\(\(\) => \{\s*\/\/ Intervalo para Hero Slider[\s\S]*?clearInterval\(heroInterval\);\s*\}\s*\}, \[playVideo\]\);/;
content = content.replace(useEffectHeroRegex, '');

// 5. Reemplazar la section del hero
const heroSectionRegex = /<section className="relative h-\[85vh\] overflow-hidden mb-24">[\s\S]*?<\/section>/;
content = content.replace(heroSectionRegex, '<HeroCarousel navigate={navigate} />');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('HeroCarousel integration complete');
