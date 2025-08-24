'use client';
import {useEffect } from 'react';
export default function ShowPreviewModal({ImgUrl,title, onClose }) {
    const TB_Url =process.env.NEXT_PUBLIC_TB_URL;
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-2">
            <div className=" bg-green-100 p-6 rounded-xl shadow-lg relative">
                <h1 className='text-black text-sm md:text-xl '>{title}</h1>
                <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700">
                    &times;
                </button>
                <img src={`${TB_Url}${ImgUrl}`} alt="Previe image"  className='object-contain mt-2'/>
            </div>
        </div>
    );
}