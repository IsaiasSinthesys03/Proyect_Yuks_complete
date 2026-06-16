import React from 'react';

interface FlipCardProps {
    name: string;
    frontImage: string;
    backImage: string;
    offsetX: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({ name, frontImage, backImage, offsetX }) => {
    return (
        <div className="group relative w-full aspect-[621/801] [perspective:1000px]">
            {/* Contenedor Rotatorio 3D */}
            <div className="w-full h-full absolute transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl rounded-3xl">
                
                {/* Cara Frontal (Frente) */}
                <div className="absolute inset-0 [backface-visibility:hidden] overflow-hidden rounded-3xl">
                    <img 
                        src={frontImage} 
                        alt={`Carta Frente ${name}`} 
                        className="absolute max-w-none" 
                        style={{ 
                            width: '309.18%', 
                            height: '187.64%', 
                            top: '-17.10%', 
                            left: offsetX 
                        }} 
                    />
                </div>
                
                {/* Cara Trasera (Lore - Dorso) */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden rounded-3xl">
                    <img 
                        src={backImage} 
                        alt={`Carta Atrás ${name}`} 
                        className="absolute max-w-none" 
                        style={{ 
                            width: '309.18%', 
                            height: '187.64%', 
                            top: '-17.10%', 
                            left: offsetX 
                        }} 
                    />
                </div>

            </div>
        </div>
    );
};
