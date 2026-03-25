"use client";

import { Upload } from "lucide-react";

export default function FileUpload() {
  function handleFileUploadButtonClick() {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.addEventListener("change", async () => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0);
        if (file) {
          const formData = new FormData();
          formData.append("pdf", file);

          await fetch("http://localhost:8000/upload/pdf", {
            method: "POST",
            body: formData,
          });

          console.log("file uploaded!");
        }
      }
    });
    el.click();
  }
  return (
    <div
      className="border-dotted border-2 bg-slate-700 flex flex-col gap-2 justify-center items-center px-16 py-8 cursor-pointer"
      onClick={handleFileUploadButtonClick}
    >
      <p>Upload PDF</p>
      <Upload />
    </div>
  );
}
