const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'landing_page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inyectar importaciones
const importLucide = "} from 'lucide-react';";
const newImports = `} from 'lucide-react';

import { Header } from './src/components/layout/Header';
import { CartDrawer } from './src/components/cart/CartDrawer';
import { HeroCarousel } from './src/components/home/HeroCarousel';
import { CharacterGrid } from './src/components/home/CharacterGrid';
`;
content = content.replace(importLucide, newImports);

// 2. Eliminar la definición monolítica de Header
const headerStartStr = "const Header = ({ navigate, currentView, openCart, openProfile, openMobileMenu, isLoggedIn, setCartTotal, cartTotal, showToast }) => {";
const headerEndStr = "const MobileMenu = ({ isOpen, close, navigate }) => {";
const headerStartIndex = content.indexOf(headerStartStr);
const headerEndIndex = content.indexOf(headerEndStr);

if(headerStartIndex !== -1 && headerEndIndex !== -1) {
    content = content.slice(0, headerStartIndex) + content.slice(headerEndIndex);
}

// 3. Eliminar la definición monolítica de CartDrawer
const cartDrawerStartStr = "const CartDrawer = ({ isOpen, close, total, showToast, requireAddress, isLoggedIn, openAuth, navigate }) => {";
const cartDrawerEndStr = "const ProfileDrawer = ({ isOpen, close, navigate, logout }) => {";
const cartDrawerStartIndex = content.indexOf(cartDrawerStartStr);
const cartDrawerEndIndex = content.indexOf(cartDrawerEndStr);

if(cartDrawerStartIndex !== -1 && cartDrawerEndIndex !== -1) {
    content = content.slice(0, cartDrawerStartIndex) + content.slice(cartDrawerEndIndex);
}

// 4. Reemplazar HeroCarousel en LandingView
const heroCarouselRegex = /<section className="relative h-\[85vh\] overflow-hidden mb-24 z-10">[\s\S]*?<\/section>/m;
content = content.replace(heroCarouselRegex, '<HeroCarousel />');

// 5. Reemplazar CharacterGrid en LandingView
const charGridRegex = /\{\/\* Identificador de Sección 'personajes' \*\/\}\s*<section id="personajes"[\s\S]*?<\/section>/m;
content = content.replace(charGridRegex, '<CharacterGrid />');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactorización estricta completada');
