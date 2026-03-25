import FileUpload from "@/components/file-upload";

export default function Home() {
  return (
    <div>
      <div className="flex min-h-screen border-t-2">
        <div className="flex-1 flex items-center justify-center p-4">
          <FileUpload />
        </div>
        <div className="flex-1 border-l-2 p-4">2</div>
      </div>
    </div>
  );
}
