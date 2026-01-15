import { FileUploaderRegular } from '@uploadcare/react-uploader';
import { useRef } from 'react';
import '@uploadcare/react-uploader/core.css';
import type { Attachment } from '../lib/api';

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
	const processedUuids = useRef<Set<string>>(new Set());

	const handleChangeEvent = (e: { allEntries: UploadEntry[] }) => {
		if (e.allEntries) {
			const newFiles: Attachment[] = [];

			for (const f of e.allEntries) {
				if (f.status === 'success' && !processedUuids.current.has(f.uuid)) {
					processedUuids.current.add(f.uuid);
					newFiles.push({
						uuid: f.uuid,
						name: f.fileInfo.originalFilename,
						size: f.fileInfo.size,
						cdnUrl: f.cdnUrl,
						mimeType: f.fileInfo.mimeType,
					});
				}
			}

			if (newFiles.length > 0) {
				onUploadComplete(newFiles);
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
