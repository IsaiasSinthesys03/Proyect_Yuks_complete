import React from 'react';
import { FlipCard } from '../ui/FlipCard';

interface CharacterGridProps {
    children?: React.ReactNode;
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({ children }) => {
    const characters = [
        { 
            name: 'Fango', 
            offsetX: '-205.15%', 
            front: '/assets/imgWeb/Banner_Lore/Cards/Trj_Fango_Frente.png', 
            back: '/assets/imgWeb/Banner_Lore/Cards/Trj_Fango_Atras.png' 
        },
        { 
            name: 'Lolita', 
            offsetX: '-104.50%', 
            front: '/assets/imgWeb/Banner_Lore/Cards/Trj_Lolita_Frente.png', 
            back: '/assets/imgWeb/Banner_Lore/Cards/Trj_Lolita_Atras.png' 
        },
        { 
            name: 'Mila', 
            offsetX: '-3.86%', 
            front: '/assets/imgWeb/Banner_Lore/Cards/Trj_Mila_Frente.png', 
            back: '/assets/imgWeb/Banner_Lore/Cards/Trj_Mila_Atras.png' 
        }
    ];

    return (
        <section id="personajes" className="pt-24 pb-4 bg-[#3a2212] relative overflow-hidden !mt-0" style={{ marginBottom: '-150px' }}>
            {/* Fondo de patrón SVG integrado de madera selvática */}
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='none' stroke='black' stroke-width='1.5' stroke-opacity='0.16'%3E%3Cpath d='M10 0 C 15 30, 5 70, 10 110 C 15 130, 25 145, 20 160'/%3E%3Cpath d='M30 0 C 25 40, 35 80, 25 120 C 20 140, 30 150, 35 160'/%3E%3Cpath d='M70 0 C 65 30, 55 50, 55 70 C 55 90, 65 110, 70 160'/%3E%3Cpath d='M90 0 C 95 30, 105 50, 105 70 C 105 90, 95 110, 90 160'/%3E%3Cellipse cx='80' cy='70' rx='10' ry='18' stroke-width='1'/%3E%3Cellipse cx='80' cy='70' rx='18' ry='30' stroke-width='1.2'/%3E%3Cellipse cx='80' cy='70' rx='28' ry='45' stroke-width='1.5'/%3E%3Cpath d='M50 0 C 45 40, 35 60, 35 70 C 35 80, 45 100, 50 160'/%3E%3Cpath d='M110 0 C 115 40, 125 60, 125 70 C 125 80, 115 100, 110 160'/%3E%3Cpath d='M130 0 C 125 45, 140 85, 135 125 C 130 140, 135 150, 130 160'/%3E%3Cpath d='M150 0 C 155 35, 145 75, 150 115 C 155 135, 145 150, 150 160'/%3E%3C/g%3E%3Cg fill='none' stroke='white' stroke-width='1' stroke-opacity='0.08'%3E%3Cpath d='M20 0 C 25 35, 15 75, 20 115 C 25 135, 35 150, 30 160'/%3E%3Cpath d='M60 0 C 55 45, 45 62, 45 70 C 45 78, 55 95, 60 160'/%3E%3Cpath d='M100 0 C 105 45, 115 62, 115 70 C 115 78, 105 95, 100 160'/%3E%3Cpath d='M140 0 C 135 40, 150 80, 145 120 C 140 135, 145 145, 140 160'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                }}
            ></div>
            
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-white">Domina el Campo</h2>
                    <p className="text-white/80 mt-2 font-bold">Conoce a tus aliados en esta aventura.</p>
                </div>
                
                {/* Cuadrícula de Tarjetas con la Perspectiva requerida para el efecto 3D global */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 [perspective:1000px]">
                    {characters.map((char, i) => (
                        <FlipCard 
                            key={i} 
                            name={char.name} 
                            frontImage={char.front} 
                            backImage={char.back} 
                            offsetX={char.offsetX} 
                        />
                    ))}
                </div>
            </div>

            {children}
        </section>
    );
};
