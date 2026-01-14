import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";
import type { Attachment } from "../lib/api";

interface FileUploaderProps {
	onUploadComplete: (files: Attachment[]) => void;
}

interface UploadEntry {
	status: string;
	uuid: string;
	cdnUrl: string;
	fileInfo: {
		originalFilename: string;
		size: number;
		mimeType: string;
	};
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
	const handleChangeEvent = (e: { allEntries: UploadEntry[] }) => {
		if (e.allEntries) {
			const successfulFiles: Attachment[] = e.allEntries
				.filter((f) => f.status === "success")
				.map((f) => ({
					uuid: f.uuid,
					name: f.fileInfo.originalFilename,
					size: f.fileInfo.size,
					cdnUrl: f.cdnUrl,
					mimeType: f.fileInfo.mimeType,
				}));

			if (successfulFiles.length > 0) {
				onUploadComplete(successfulFiles);
			}
		}
	};

	return (
		<FileUploaderRegular
			pubkey="d86ddf17b265b2d92afa"
			classNameUploader="uc-dark uc-purple"
			sourceList="local, camera"
			userAgentIntegration="llm-react"
			filesViewMode="grid"
			onChange={handleChangeEvent}
		/>
	);
}
