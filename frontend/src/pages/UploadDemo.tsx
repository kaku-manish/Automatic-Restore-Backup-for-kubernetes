import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, Server, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Uses the Node.js Docker API we built running on Port 3000
const UPLOADER_API_URL = "http://localhost:3001/api/files";

const UploadDemo = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Fetch the files directly from the K8s PVC mounted in our backend API
    const fetchFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const res = await fetch(UPLOADER_API_URL);
            if (res.ok) {
                const data = await res.json();
                setUploadedFiles(data);
            }
        } catch (e) {
            console.warn("Uploader API on port 3000 might not be running yet.");
        } finally {
            setIsLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchFiles();

        // Enable real-time tracking of file changes via Server-Sent Events
        const eventSource = new EventSource(`${UPLOADER_API_URL}/stream`);
        eventSource.onmessage = (event) => {
            if (event.data !== 'connected') {
                // Introduce a slight delay to allow the filesystem to finish the I/O event
                setTimeout(() => {
                     fetchFiles();
                }, 100);
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload first.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Send file to Node.js backend
            const res = await fetch(`${UPLOADER_API_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            toast.success("File uploaded to Kubernetes Persistent Volume!");
            toast.info("VaultGuard Watcher triggered an instant Velero backup.");

            setFile(null);
            fetchFiles(); // Refresh file list

        } catch (error) {
            toast.error("Could not upload. Make sure the Node.js uploader is running on port 3000.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">File Upload Demo</h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload files straight into a K8s PVC to trigger VaultGuard automation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Upload Card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <UploadCloud className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Cloud Storage Dropzone</h2>
                            <p className="text-xs text-muted-foreground">Path: <code>/data/uploads</code></p>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/10">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                        >
                            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            {file ? (
                                <p className="text-sm font-medium text-primary">{file.name}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Click to select a CSV or Excel file</p>
                            )}
                        </label>
                    </div>

                    <Button
                        className="w-full mt-6"
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? "Uploading & Syncing..." : "Upload to Persistent Volume"}
                    </Button>
                </motion.div>

                {/* Live PVC Viewer Card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent border border-border flex items-center justify-center">
                                <Server className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Live PVC Contents</h2>
                                <p className="text-xs text-muted-foreground">Monitoring data stored inside Kubernetes</p>
                            </div>
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchFiles} disabled={isLoadingFiles}>
                            <RefreshCcw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {uploadedFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                                No files detected in /data/uploads yet.
                            </div>
                        ) : (
                            uploadedFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-4 h-4 text-success" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{f.fileName}</p>
                                            <p className="text-[10px] text-muted-foreground">VaultGuard Protected • {(f.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UploadDemo;
