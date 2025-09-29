import React, { useEffect, useState } from 'react';

const Confetti = () => {
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 50 }).map(() => ({
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            backgroundColor: ['#6C63FF', '#FF6584', '#00C49A', '#FFD93D'][Math.floor(Math.random() * 4)],
        }));
        setPieces(newPieces);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {pieces.map((piece, index) => (
                <div
                    key={index}
                    className="confetti-piece"
                    style={{ ...piece }}
                />
            ))}
        </div>
    );
};

export default Confetti;