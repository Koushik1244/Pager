// src\components\ui\ImageUploader.tsx

"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { IoImageSharp } from "react-icons/io5";

type Props = {
    onUpload: (url: string) => void;
};

export default function ImageUploader({ onUpload }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploading(true);

            const res = await axios.post("/api/upload", formData);
            const url = res.data.url;

            setPreview(url);
            onUpload(url);
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="
      w-full h-40
      border-2 border-dashed border-primary/30
      rounded-lg
      flex items-center justify-center
      cursor-pointer
      bg-white/50 dark:bg-neutralDark
      hover:border-primary/60
      transition
      relative overflow-hidden
      "
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />

            {preview ? (
                <img
                    src={preview}
                    className="w-full h-full object-cover"
                />
            ) : uploading ? (
                <p className="text-primary font-medium">Uploading...</p>
            ) : (
                <div className="text-center text-primary/70">
                    {/* <IoImageSharp size={42} className="align-middle mx-auto" /> */}
                    <p className="text-sm">Drag or click to upload image</p>
                </div>
            )}
        </div>
    );
}
